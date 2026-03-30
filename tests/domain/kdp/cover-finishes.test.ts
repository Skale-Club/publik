import { describe, it, expect } from "vitest"
import { COVER_FINISHES } from "../../../src/domain/kdp/cover-finishes"

describe("cover-finishes", () => {
  it("COVER_FINISHES has exactly 2 entries", () => {
    expect(COVER_FINISHES).toHaveLength(2)
  })

  it("Values are glossy and matte", () => {
    const values = COVER_FINISHES.map((f) => f.value)
    expect(values).toContain("glossy")
    expect(values).toContain("matte")
  })

  it("All entries have value, label, and description fields", () => {
    COVER_FINISHES.forEach((finish) => {
      expect(finish).toHaveProperty("value")
      expect(finish).toHaveProperty("label")
      expect(finish).toHaveProperty("description")
    })
  })
})
