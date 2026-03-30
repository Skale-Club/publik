import { describe, it, expect } from "vitest"
import { bookCreateSchema, bookUpdateSchema } from "../../../src/domain/book/book-validator"

describe("book-validator", () => {
  describe("bookCreateSchema", () => {
    it("valid book creation with title only uses defaults", () => {
      const result = bookCreateSchema.parse({ title: "My Book" })
      expect(result.title).toBe("My Book")
      expect(result.trimSizeId).toBe("6x9")
      expect(result.paperType).toBe("white")
      expect(result.inkType).toBe("bw")
      expect(result.coverFinish).toBe("matte")
    })

    it("valid book creation with all fields", () => {
      const result = bookCreateSchema.parse({
        title: "My Book",
        description: "A great book",
        trimSizeId: "5.5x8.5",
        paperType: "cream",
        inkType: "premium-color",
        coverFinish: "glossy",
      })
      expect(result.title).toBe("My Book")
      expect(result.description).toBe("A great book")
      expect(result.trimSizeId).toBe("5.5x8.5")
      expect(result.paperType).toBe("cream")
      expect(result.inkType).toBe("premium-color")
      expect(result.coverFinish).toBe("glossy")
    })

    it("rejects empty title", () => {
      expect(() => bookCreateSchema.parse({ title: "" })).toThrow()
    })

    it("rejects title over 200 characters", () => {
      const longTitle = "a".repeat(201)
      expect(() => bookCreateSchema.parse({ title: longTitle })).toThrow()
    })

    it("rejects description over 2000 characters", () => {
      const longDesc = "a".repeat(2001)
      expect(() => bookCreateSchema.parse({ title: "Book", description: longDesc })).toThrow()
    })

    it("rejects invalid trimSizeId", () => {
      expect(() => bookCreateSchema.parse({ title: "Book", trimSizeId: "invalid-id" })).toThrow()
    })

    it("rejects invalid paperType", () => {
      expect(() => bookCreateSchema.parse({ title: "Book", paperType: "invalid" as any })).toThrow()
    })

    it("rejects invalid inkType", () => {
      expect(() => bookCreateSchema.parse({ title: "Book", inkType: "invalid" as any })).toThrow()
    })

    it("rejects invalid coverFinish", () => {
      expect(() => bookCreateSchema.parse({ title: "Book", coverFinish: "invalid" as any })).toThrow()
    })
  })

  describe("bookUpdateSchema", () => {
    it("accepts empty object for partial update", () => {
      const result = bookUpdateSchema.parse({})
      expect(result).toEqual({})
    })

    it("accepts only title field", () => {
      const result = bookUpdateSchema.parse({ title: "New Title" })
      expect(result).toEqual({ title: "New Title" })
    })

    it("accepts partial update with multiple fields", () => {
      const result = bookUpdateSchema.parse({
        title: "New Title",
        trimSizeId: "8x10",
      })
      expect(result.title).toBe("New Title")
      expect(result.trimSizeId).toBe("8x10")
    })
  })
})
