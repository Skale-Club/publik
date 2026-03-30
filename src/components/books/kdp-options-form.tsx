"use client"

import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"
import { PAPER_INK_COMBOS } from "@/domain/kdp/paper-types"
import { COVER_FINISHES } from "@/domain/kdp/cover-finishes"
import { Book } from "@/domain/book/book"

interface KDPOptionsFormProps {
  book: Book
}

export function KDPOptionsForm({ book }: KDPOptionsFormProps) {
  const paperTypes = Array.from(new Set(PAPER_INK_COMBOS.map((c) => c.paper)))
  const inkTypes = Array.from(new Set(PAPER_INK_COMBOS.map((c) => c.ink)))
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="trimSizeId" className="block text-sm font-medium mb-1">
          Trim Size
        </label>
        <select
          id="trimSizeId"
          name="trimSizeId"
          defaultValue={book.trimSizeId}
          className="w-full px-3 py-2 border rounded-md"
        >
          {KDP_TRIM_SIZES.map((size) => (
            <option key={size.id} value={size.id}>
              {size.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="paperType" className="block text-sm font-medium mb-1">
          Paper Type
        </label>
        <select
          id="paperType"
          name="paperType"
          defaultValue={book.paperType}
          className="w-full px-3 py-2 border rounded-md"
        >
          {paperTypes.map((type) => (
            <option key={type} value={type}>
              {type === "white" ? "White" : "Cream"}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="inkType" className="block text-sm font-medium mb-1">
          Ink Type
        </label>
        <select
          id="inkType"
          name="inkType"
          defaultValue={book.inkType}
          className="w-full px-3 py-2 border rounded-md"
        >
          {inkTypes.map((type) => (
            <option key={type} value={type}>
              {type === "bw" ? "Black & White" : type === "standard-color" ? "Standard Color" : "Premium Color"}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="coverFinish" className="block text-sm font-medium mb-1">
          Cover Finish
        </label>
        <select
          id="coverFinish"
          name="coverFinish"
          defaultValue={book.coverFinish}
          className="w-full px-3 py-2 border rounded-md"
        >
          {COVER_FINISHES.map((finish) => (
            <option key={finish.value} value={finish.value}>
              {finish.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
