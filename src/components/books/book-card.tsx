import { Book } from "@/domain/book/book"
import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"
import { format } from "date-fns"
import Link from "next/link"

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const trimSize = KDP_TRIM_SIZES.find((t) => t.id === book.trimSizeId)
  
  return (
    <Link
      href={`/books/${book.id}`}
      className="block p-6 border rounded-lg hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-lg mb-2">{book.title}</h3>
      <p className="text-sm text-gray-600 mb-1">
        Trim: {trimSize?.label || book.trimSizeId}
      </p>
      <p className="text-sm text-gray-500">
        Created: {format(new Date(book.createdAt), "MMM d, yyyy")}
      </p>
    </Link>
  )
}
