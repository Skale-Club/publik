import { describe, it, expect } from "vitest"

describe("Book Server Actions", () => {
  it("exports createBook, updateBook, deleteBook functions", async () => {
    const mod = await import("@/app/(dashboard)/books/[bookId]/actions")
    expect(typeof mod.createBook).toBe("function")
    expect(typeof mod.updateBook).toBe("function")
    expect(typeof mod.deleteBook).toBe("function")
  })
})
