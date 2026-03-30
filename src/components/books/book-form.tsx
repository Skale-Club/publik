"use client"

import { useRef } from "react"
import { createBook } from "@/app/(dashboard)/books/[bookId]/actions"

export function BookForm() {
  const formRef = useRef<HTMLFormElement>(null)
  
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createBook(formData)
        formRef.current?.reset()
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Book Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter book title"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter book description"
        />
      </div>
      
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Create Book
      </button>
    </form>
  )
}
