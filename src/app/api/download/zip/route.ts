/**
 * ZIP Package Download API Endpoint
 * Creates a ZIP package with interior PDF, cover PDF, and KDP checklist
 */

import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { getDb } from '@/infrastructure/db/client'
import { generateChecklist, type BookData } from '@/lib/export/checklist'

export const maxDuration = 300 // 5 minutes for large packages

/**
 * POST /api/download/zip
 * Creates ZIP package with all KDP-ready files
 * 
 * Body:
 *   - bookId: Book ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId } = body
    
    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId is required' },
        { status: 400 }
      )
    }
    
    const db = getDb()
    
    // Fetch book data
    const bookResult = db.exec(`SELECT * FROM books WHERE id = '${bookId}' AND deleted_at IS NULL`)
    
    if (bookResult.length === 0 || bookResult[0].values.length === 0) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    const columns = bookResult[0].columns
    const values = bookResult[0].values[0]
    const book: Record<string, unknown> = {}
    columns.forEach((col: string, i: number) => {
      book[col] = values[i]
    })
    
    const bookTitle = String(book.title || 'Untitled')
    const bookAuthor = book.author ? String(book.author) : undefined
    const trimSize = String(book.trim_size_id || '6x9')
    const paperType = String(book.paper_type || 'white')
    
    // Fetch chapters for page count
    const chaptersResult = db.exec(
      `SELECT COUNT(*) as count FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL`
    )
    const pageCount = chaptersResult.length > 0 
      ? Number(chaptersResult[0].values[0][0]) || 1 
      : 1
    
    // Prepare book data for checklist
    const bookData: BookData = {
      title: bookTitle,
      author: bookAuthor,
      trimSize,
      paperType,
      pageCount,
      interiorWidth: 6, // Default, would come from trim size config
      interiorHeight: 9,
      coverWidth: 12.5, // Including spine and bleed
      coverHeight: 9,
      spineWidth: pageCount * 0.002252 // Rough estimate
    }
    
    // Generate checklist content
    const checklistContent = generateChecklist(bookData)
    
    // Fetch interior PDF
    const pdfResponse = await fetch(
      `${request.nextUrl.origin}/api/generate/pdf?bookId=${bookId}`
    )
    
    let interiorPdfBuffer: Buffer | null = null
    if (pdfResponse.ok) {
      const pdfArrayBuffer = await pdfResponse.arrayBuffer()
      interiorPdfBuffer = Buffer.from(pdfArrayBuffer)
    }
    
    // Fetch cover PDF
    const coverResponse = await fetch(
      `${request.nextUrl.origin}/api/generate/cover?bookId=${bookId}`
    )
    
    let coverPdfBuffer: Buffer | null = null
    if (coverResponse.ok) {
      const coverArrayBuffer = await coverResponse.arrayBuffer()
      coverPdfBuffer = Buffer.from(coverArrayBuffer)
    }
    
    // Create archive with streaming
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    const chunks: Uint8Array[] = []
    
    return new Promise<NextResponse>((resolve) => {
      archive.on('data', (chunk) => {
        chunks.push(chunk)
      })
      
      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks)
        
        // Sanitize filename
        const safeTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
        
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
          NextResponse.json(
            { error: 'Failed to create ZIP package' },
            { status: 500 }
          )
        )
      })
      
      // Add files to archive
      if (interiorPdfBuffer) {
        archive.append(interiorPdfBuffer, { name: 'interior.pdf' })
      } else {
        archive.append('Interior PDF not available. Please generate it first.', { 
          name: 'interior-ERROR.txt' 
        })
      }
      
      if (coverPdfBuffer) {
        archive.append(coverPdfBuffer, { name: 'cover.pdf' })
      } else {
        archive.append('Cover PDF not available. Please generate it first.', { 
          name: 'cover-ERROR.txt' 
        })
      }
      
      // Always include checklist
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
