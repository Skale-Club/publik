import { describe, it, expect } from "vitest"
import { calculateSpineWidth, MIN_PAGES_FOR_SPINE_TEXT } from "../../../src/domain/kdp/spine-width"

describe("spine-width", () => {
  it("calculateSpineWidth(200, white) ≈ 0.4504", () => {
    const width = calculateSpineWidth(200, "white")
    expect(width).toBeCloseTo(0.4504, 4)
  })

  it("calculateSpineWidth(200, cream) = 0.5", () => {
    const width = calculateSpineWidth(200, "cream")
    expect(width).toBeCloseTo(0.5, 4)
  })

  it("calculateSpineWidth(200, premium-color) ≈ 0.4694", () => {
    const width = calculateSpineWidth(200, "premium-color")
    expect(width).toBeCloseTo(0.4694, 4)
  })

  it("calculateSpineWidth(200, standard-color) ≈ 0.4504", () => {
    const width = calculateSpineWidth(200, "standard-color")
    expect(width).toBeCloseTo(0.4504, 4)
  })

  it("calculateSpineWidth(0, white) = 0", () => {
    const width = calculateSpineWidth(0, "white")
    expect(width).toBe(0)
  })

  it("MIN_PAGES_FOR_SPINE_TEXT = 79", () => {
    expect(MIN_PAGES_FOR_SPINE_TEXT).toBe(79)
  })
})
