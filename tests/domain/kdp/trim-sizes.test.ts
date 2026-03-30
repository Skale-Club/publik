import { describe, it, expect } from "vitest"
import { KDP_TRIM_SIZES } from "../../../src/domain/kdp/trim-sizes"

describe("trim-sizes", () => {
  it("KDP_TRIM_SIZES has exactly 16 entries", () => {
    expect(KDP_TRIM_SIZES).toHaveLength(16)
  })

  it("each entry has all required fields", () => {
    KDP_TRIM_SIZES.forEach((trim) => {
      expect(trim).toHaveProperty("id")
      expect(trim).toHaveProperty("label")
      expect(trim).toHaveProperty("widthIn")
      expect(trim).toHaveProperty("heightIn")
      expect(trim).toHaveProperty("widthCm")
      expect(trim).toHaveProperty("heightCm")
      expect(trim).toHaveProperty("isLarge")
      expect(trim).toHaveProperty("maxPages")
    })
  })

  it("all IDs are unique", () => {
    const ids = KDP_TRIM_SIZES.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('6x9 has widthIn=6, heightIn=9', () => {
    const trim = KDP_TRIM_SIZES.find((t) => t.id === "6x9")
    expect(trim?.widthIn).toBe(6)
    expect(trim?.heightIn).toBe(9)
  })

  it("8.5x11 has isLarge=true", () => {
    const trim = KDP_TRIM_SIZES.find((t) => t.id === "8.5x11")
    expect(trim?.isLarge).toBe(true)
  })

  it("A4 has standard-color-white maxPages = 0", () => {
    const trim = KDP_TRIM_SIZES.find((t) => t.id === "8.27x11.69")
    expect(trim?.maxPages["standard-color-white"]).toBe(0)
  })

  it("non-A4 entries have maxPages > 0", () => {
    KDP_TRIM_SIZES.forEach((trim) => {
      if (trim.id !== "8.27x11.69") {
        expect(trim.maxPages["bw-white"]).toBeGreaterThan(0)
      }
    })
  })
})
