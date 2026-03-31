import { describe, it, expect } from "vitest"
import { calculateSpineWidth } from "../../../src/lib/pdf/spine-calculator"
import type { SpineWidthResult, PaperType } from "../../../src/lib/pdf/spine-calculator"

describe("spine-calculator", () => {
  // Test 1: 300 pages with cream paper returns 0.75" spine (300 * 0.0025)
  it("300 pages cream paper returns 0.75 inches spine", () => {
    const result = calculateSpineWidth(300, "cream")
    expect(result.widthInches).toBeCloseTo(0.75, 4)
  })

  // Test 2: 300 pages with white paper returns 0.6756" spine (300 * 0.002252)
  it("300 pages white paper returns 0.6756 inches spine", () => {
    const result = calculateSpineWidth(300, "white")
    expect(result.widthInches).toBeCloseTo(0.6756, 4)
  })

  // Test 3: 100 pages with premium-color returns 0.2347" spine (100 * 0.002347)
  it("100 pages premium-color returns 0.2347 inches spine", () => {
    const result = calculateSpineWidth(100, "premium-color")
    expect(result.widthInches).toBeCloseTo(0.2347, 4)
  })

  // Test 4: Returns all units (inches, mm, points)
  it("returns all units (inches, mm, points)", () => {
    const result = calculateSpineWidth(100, "white")
    expect(result.widthInches).toBeDefined()
    expect(result.widthMm).toBeDefined()
    expect(result.widthPoints).toBeDefined()
    // 100 * 0.002252 = 0.2252 inches
    // 0.2252 * 25.4 = 5.72 mm
    // 0.2252 * 72 = 16.21 points
    expect(result.widthMm).toBeCloseTo(5.72, 1)
    expect(result.widthPoints).toBeCloseTo(16.21, 1)
  })

  // Test 5: canHaveSpineText returns false for 79 pages
  it("canHaveSpineText returns false for 79 pages", () => {
    const result = calculateSpineWidth(79, "white")
    expect(result.canHaveSpineText).toBe(false)
  })

  // Test 6: canHaveSpineText returns true for 80 pages
  it("canHaveSpineText returns true for 80 pages", () => {
    const result = calculateSpineWidth(80, "white")
    expect(result.canHaveSpineText).toBe(true)
  })

  // Test 7: Warning generated for page count < 24
  it("warning generated for page count < 24", () => {
    const result = calculateSpineWidth(20, "white")
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain("24")
  })
})