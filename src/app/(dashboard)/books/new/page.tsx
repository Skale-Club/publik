import { BookForm } from "@/components/books/book-form"
import Link from "next/link"

export default function NewBookPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link
        href="/"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Dashboard
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Create New Book</h1>
      
      <BookForm />
    </div>
  )
}
