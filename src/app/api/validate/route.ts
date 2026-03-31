import { NextRequest, NextResponse } from 'next/server'
import { validateBookForKDP, type ValidationResult } from '@/lib/export/validator'

/**
 * GET /api/validate
 * Validates a book for KDP compliance
 * 
 * Query params:
 *   - bookId: Book ID to validate
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')
  
  if (!bookId) {
    return NextResponse.json(
      { error: 'bookId is required' },
      { status: 400 }
    )
  }
  
  try {
    const result: ValidationResult = await validateBookForKDP(bookId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Validation error:', error)
    
    return NextResponse.json(
      { 
        valid: false,
        interior: { 
          valid: false, 
          issues: [{ 
            type: 'error', 
            category: 'dimensions' as const, 
            message: 'Validation failed' 
          }], 
          warnings: [] 
        },
        cover: { 
          valid: false, 
          issues: [{ 
            type: 'error', 
            category: 'dimensions' as const, 
            message: 'Validation failed' 
          }], 
          warnings: [] 
        }
      },
      { status: 500 }
    )
  }
}
