"use client"

import { useRef } from "react"
import { updateBook } from "@/app/(dashboard)/books/[bookId]/actions"
import { KDPOptionsForm } from "./kdp-options-form"
import { Book } from "@/domain/book/book"

interface BookSettingsFormProps {
  book: Book
}

export function BookSettingsForm({ book }: BookSettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await updateBook(book.id, formData)
      }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Book Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={book.title}
          required
          maxLength={200}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={book.description || ""}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">KDP Printing Options</h3>
        <KDPOptionsForm book={book} />
      </div>
      
      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}
