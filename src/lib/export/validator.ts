import { db } from '@/infrastructure/db/client'
import { books } from '@/infrastructure/db/schema/books'
import { chapters as chaptersTable } from '@/infrastructure/db/schema/chapters'
import { eq, isNull, and, sql } from 'drizzle-orm'
import { validateTrimSize, type TrimSizeValidation } from '@/lib/pdf/trim-size-validator'
import { validateCoverForKDP, type CoverValidationResult } from '@/lib/covers/kdp-validation'

export interface ValidationIssue {
  type: 'error' | 'warning'
  category: 'dimensions' | 'margins' | 'fonts' | 'bleed' | 'image-resolution' | 'spine-width'
  message: string
  details?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  interior: {
    valid: boolean
    issues: ValidationIssue[]
    warnings: string[]
  }
  cover: {
    valid: boolean
    issues: ValidationIssue[]
    warnings: string[]
  }
}

interface BookData {
  id: string
  title: string
  author?: string
  trimSize: string
  paperType: string
  pageCount: number
  interiorWidth?: number
  interiorHeight?: number
  coverWidth?: number
  coverHeight?: number
  spineWidth?: number
}

export async function validateBookForKDP(bookId: string): Promise<ValidationResult> {
  const book = await getBookData(bookId)

  if (!book) {
    return {
      valid: false,
      interior: {
        valid: false,
        issues: [{ type: 'error', category: 'dimensions', message: 'Book not found' }],
        warnings: [],
      },
      cover: {
        valid: false,
        issues: [{ type: 'error', category: 'dimensions', message: 'Book not found' }],
        warnings: [],
      },
    }
  }

  const interiorValidation = validateInterior(book)
  const coverValidation = validateCover(book)

  return {
    valid: interiorValidation.valid && coverValidation.valid,
    interior: interiorValidation,
    cover: coverValidation,
  }
}

function validateInterior(book: BookData): { valid: boolean; issues: ValidationIssue[]; warnings: string[] } {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []

  if (!book.pageCount || book.pageCount < 1) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: 'Book has no content. Add chapters before generating PDF.',
    })
  }

  const trimValidation: TrimSizeValidation = validateTrimSize(book.trimSize)

  if (!trimValidation.valid) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: trimValidation.message || 'Invalid trim size',
      details: { trimSize: book.trimSize },
    })
  } else if (!trimValidation.match) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: trimValidation.message || 'Dimensions do not match KDP specification',
      details: { expected: trimValidation.expected, actual: trimValidation.actual },
    })
  }

  if (book.pageCount > 828) {
    warnings.push('Book exceeds 828 pages. KDP may reject very long books.')
  }

  if (book.paperType === 'premium-color' && book.pageCount > 150) {
    warnings.push('Premium color books over 150 pages may incur additional costs.')
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
    warnings,
  }
}

function validateCover(book: BookData): { valid: boolean; issues: ValidationIssue[]; warnings: string[] } {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []

  if (!book.coverWidth || !book.coverHeight) {
    warnings.push('Cover not yet generated. Generate cover to validate dimensions.')
    return { valid: true, issues: [], warnings }
  }

  const coverValidation: CoverValidationResult = validateCoverForKDP(
    'cover-placeholder',
    book.coverWidth,
    book.coverHeight,
    book.trimSize,
    book.pageCount || 1,
    book.paperType as 'white' | 'cream' | 'standard-color' | 'premium-color'
  )

  for (const error of coverValidation.errors) {
    issues.push({ type: 'error', category: 'dimensions', message: error })
  }

  for (const warning of coverValidation.warnings) {
    warnings.push(warning)
  }

  if (book.pageCount && book.spineWidth) {
    const expectedSpineWidth = calculateExpectedSpineWidth(book.pageCount, book.paperType)
    const tolerance = 0.02

    if (Math.abs(book.spineWidth - expectedSpineWidth) > expectedSpineWidth * tolerance) {
      warnings.push(`Spine width (${book.spineWidth.toFixed(2)}") differs from expected (${expectedSpineWidth.toFixed(2)}")`)
    }
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
    warnings,
  }
}

function calculateExpectedSpineWidth(pageCount: number, paperType: string): number {
  const baseMultiplier = paperType.includes('color') ? 0.0025 : 0.002252
  return pageCount * baseMultiplier
}

async function getBookData(bookId: string): Promise<BookData | null> {
  const bookRows = await db.select().from(books).where(eq(books.id, bookId))
  const bookRow = bookRows[0]

  if (!bookRow || bookRow.deletedAt) return null

  const chapterCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(chaptersTable)
    .where(and(eq(chaptersTable.bookId, bookId), isNull(chaptersTable.deletedAt)))

  return {
    id: bookRow.id,
    title: bookRow.title,
    author: bookRow.author,
    trimSize: bookRow.trimSizeId,
    paperType: bookRow.paperType,
    pageCount: chapterCountResult[0]?.count ?? 0,
  }
}
