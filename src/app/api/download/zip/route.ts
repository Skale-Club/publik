import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { db } from '@/infrastructure/db/client'
import { books } from '@/infrastructure/db/schema/books'
import { chapters as chaptersTable } from '@/infrastructure/db/schema/chapters'
import { generateChecklist, type BookData } from '@/lib/export/checklist'
import { generateInteriorPDF } from '@/lib/pdf/generate-interior'
import { generateCoverPDF } from '@/lib/pdf/generate-cover'
import { eq, isNull, and, sql } from 'drizzle-orm'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 })
    }

    const bookRows = await db.select().from(books).where(eq(books.id, bookId))
    const bookRow = bookRows[0]

    if (!bookRow || bookRow.deletedAt) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const chapterCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chaptersTable)
      .where(and(eq(chaptersTable.bookId, bookId), isNull(chaptersTable.deletedAt)))

    const pageCount = chapterCountResult[0]?.count ?? 1
    const trimSize = bookRow.trimSizeId || '6x9'
    const paperType = bookRow.paperType || 'white'

    const bookData: BookData = {
      title: bookRow.title,
      author: bookRow.author,
      trimSize,
      paperType,
      pageCount,
      interiorWidth: 6,
      interiorHeight: 9,
      coverWidth: 12.5,
      coverHeight: 9,
      spineWidth: pageCount * 0.002252,
    }

    const checklistContent = generateChecklist(bookData)

    // Generate PDFs directly without internal HTTP round-trips
    const [interiorResult, coverResult] = await Promise.allSettled([
      generateInteriorPDF(bookId),
      generateCoverPDF(bookId),
    ])

    const interiorPdfBuffer =
      interiorResult.status === 'fulfilled' ? interiorResult.value : null
    const coverPdfBuffer =
      coverResult.status === 'fulfilled' ? coverResult.value : null

    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Uint8Array[] = []

    return new Promise<NextResponse>((resolve) => {
      archive.on('data', (chunk) => {
        chunks.push(chunk)
      })

      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks)
        const safeTitle = bookRow.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)

        resolve(
          new NextResponse(zipBuffer, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${safeTitle}-kdp-files.zip"`,
            },
          })
        )
      })

      archive.on('error', (err) => {
        console.error('Archive error:', err)
        resolve(
          NextResponse.json({ error: 'Failed to create ZIP package' }, { status: 500 })
        )
      })

      if (interiorPdfBuffer) {
        archive.append(interiorPdfBuffer, { name: 'interior.pdf' })
      } else {
        const reason =
          interiorResult.status === 'rejected'
            ? String(interiorResult.reason)
            : 'Unknown error'
        archive.append(`Interior PDF could not be generated: ${reason}`, {
          name: 'interior-ERROR.txt',
        })
      }

      if (coverPdfBuffer) {
        archive.append(coverPdfBuffer, { name: 'cover.pdf' })
      } else {
        const reason =
          coverResult.status === 'rejected'
            ? String(coverResult.reason)
            : 'Unknown error'
        archive.append(`Cover PDF could not be generated: ${reason}`, {
          name: 'cover-ERROR.txt',
        })
      }

      archive.append(checklistContent, { name: 'kdp-checklist.txt' })
      archive.finalize()
    })
  } catch (error) {
    console.error('ZIP download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ZIP package' },
      { status: 500 }
    )
  }
}
