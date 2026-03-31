/**
 * KDP Compliance Validator
 * Validates generated files against Amazon KDP specifications
 */

import { validateTrimSize, type TrimSizeValidation } from '@/lib/pdf/trim-size-validator'
import { validateCoverForKDP, type CoverValidationResult } from '@/lib/covers/kdp-validation'

/**
 * Validation issue for a specific category
 */
export interface ValidationIssue {
  type: 'error' | 'warning'
  category: 'dimensions' | 'margins' | 'fonts' | 'bleed' | 'image-resolution' | 'spine-width'
  message: string
  details?: Record<string, unknown>
}

/**
 * Validation result for a book
 */
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

/**
 * Book data for validation
 */
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

/**
 * Validate book for KDP compliance
 * @param bookId - Book ID to validate
 * @returns Validation result with issues and warnings
 */
export async function validateBookForKDP(bookId: string): Promise<ValidationResult> {
  // Fetch book data from database
  const book = await getBookData(bookId)
  
  if (!book) {
    return {
      valid: false,
      interior: {
        valid: false,
        issues: [{ type: 'error', category: 'dimensions', message: 'Book not found' }],
        warnings: []
      },
      cover: {
        valid: false,
        issues: [{ type: 'error', category: 'dimensions', message: 'Book not found' }],
        warnings: []
      }
    }
  }
  
  // Validate interior PDF
  const interiorValidation = validateInterior(book)
  
  // Validate cover PDF
  const coverValidation = validateCover(book)
  
  const overallValid = interiorValidation.valid && coverValidation.valid
  
  return {
    valid: overallValid,
    interior: interiorValidation,
    cover: coverValidation
  }
}

/**
 * Validate interior PDF specifications
 */
function validateInterior(book: BookData): { valid: boolean; issues: ValidationIssue[]; warnings: string[] } {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  
  // Check if book has content
  if (!book.pageCount || book.pageCount < 1) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: 'Book has no content. Add chapters before generating PDF.'
    })
  }
  
  // Validate trim size
  const trimValidation: TrimSizeValidation = validateTrimSize(book.trimSize)
  
  if (!trimValidation.valid) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: trimValidation.message || 'Invalid trim size',
      details: { trimSize: book.trimSize }
    })
  } else if (!trimValidation.match) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: trimValidation.message || 'Dimensions do not match KDP specification',
      details: { expected: trimValidation.expected, actual: trimValidation.actual }
    })
  }
  
  // Check page count limits
  if (book.pageCount > 828) {
    warnings.push('Book exceeds 828 pages. KDP may reject very long books.')
  }
  
  // Check for paper type
  if (book.paperType === 'premium-color' && book.pageCount > 150) {
    warnings.push('Premium color books over 150 pages may incur additional costs.')
  }
  
  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues,
    warnings
  }
}

/**
 * Validate cover PDF specifications
 */
function validateCover(book: BookData): { valid: boolean; issues: ValidationIssue[]; warnings: string[] } {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  
  // If no cover dimensions provided, return warning
  if (!book.coverWidth || !book.coverHeight) {
    warnings.push('Cover not yet generated. Generate cover to validate dimensions.')
    return { valid: true, issues: [], warnings }
  }
  
  // Validate cover dimensions using the validation function
  const coverValidation: CoverValidationResult = validateCoverForKDP(
    'cover-placeholder', // URL not needed for dimension validation
    book.coverWidth,
    book.coverHeight,
    book.trimSize,
    book.pageCount || 1,
    book.paperType as 'white' | 'cream' | 'standard-color' | 'premium-color'
  )
  
  // Convert cover validation errors to our format
  for (const error of coverValidation.errors) {
    issues.push({
      type: 'error',
      category: 'dimensions',
      message: error
    })
  }
  
  // Convert cover validation warnings
  for (const warning of coverValidation.warnings) {
    warnings.push(warning)
  }
  
  // Check spine width if page count available
  if (book.pageCount && book.spineWidth) {
    const expectedSpineWidth = calculateExpectedSpineWidth(book.pageCount, book.paperType)
    const tolerance = 0.02 // 2% tolerance
    
    if (Math.abs(book.spineWidth - expectedSpineWidth) > expectedSpineWidth * tolerance) {
      warnings.push(`Spine width (${book.spineWidth.toFixed(2)}") differs from expected (${expectedSpineWidth.toFixed(2)}")`)
    }
  }
  
  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues,
    warnings
  }
}

/**
 * Calculate expected spine width based on page count and paper type
 */
function calculateExpectedSpineWidth(pageCount: number, paperType: string): number {
  // Standard calculation: 0.002252 * pages for white/cream
  // Premium color uses different calculation
  const baseMultiplier = paperType.includes('color') ? 0.0025 : 0.002252
  return pageCount * baseMultiplier
}

/**
 * Get book data from database
 */
async function getBookData(bookId: string): Promise<BookData | null> {
  const { getDb } = require('@/infrastructure/db/client')
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM books WHERE id = '${bookId}' AND deleted_at IS NULL`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const book: any = {}
  
  columns.forEach((col: string, i: number) => {
    // Convert snake_case to camelCase
    const key = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    book[key] = row[i]
  })
  
  // Get page count from chapters
  const chaptersResult = db.exec(`SELECT COUNT(*) as count FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL`)
  if (chaptersResult.length > 0 && chaptersResult[0].values.length > 0) {
    book.pageCount = chaptersResult[0].values[0][0] || 0
  }
  
  return book as BookData
}

/**
 * Quick validation check - returns just valid/invalid
 */
export function isBookValidForKDP(bookId: string): boolean {
  try {
    // This is a synchronous version for quick checks
    const { getDb } = require('@/infrastructure/db/client')
    const db = getDb()
    
    const result = db.exec(`SELECT * FROM books WHERE id = '${bookId}' AND deleted_at IS NULL`)
    
    if (result.length === 0 || result[0].values.length === 0) {
      return false
    }
    
    // Basic check: book exists and has title
    return true
  } catch {
    return false
  }
}
