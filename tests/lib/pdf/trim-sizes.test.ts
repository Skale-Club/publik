/**
 * Trim Sizes Test Suite
 * Tests all 16 KDP trim sizes for correct dimensions
 */

import { describe, it, expect } from "vitest"
import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"
import { getPageDimensions, getTrimSizeLabel, isValidTrimSize } from "@/lib/pdf/page-layout"

describe("KDP Trim Sizes", () => {
  // Test all 16 KDP trim sizes
  const testCases = [
    { id: "5x8", widthIn: 5, heightIn: 8 },
    { id: "5.06x7.81", widthIn: 5.0625, heightIn: 7.8125 },
    { id: "5.25x8", widthIn: 5.25, heightIn: 8 },
    { id: "5.5x8.5", widthIn: 5.5, heightIn: 8.5 },
    { id: "6x9", widthIn: 6, heightIn: 9 },
    { id: "6.14x9.21", widthIn: 6.125, heightIn: 9.25 },
    { id: "6.69x9.61", widthIn: 6.6875, heightIn: 9.625 },
    { id: "7x10", widthIn: 7, heightIn: 10 },
    { id: "7.44x9.69", widthIn: 7.4375, heightIn: 9.6875 },
    { id: "7.5x9.25", widthIn: 7.5, heightIn: 9.25 },
    { id: "8x10", widthIn: 8, heightIn: 10 },
    { id: "8.25x6", widthIn: 8.25, heightIn: 6 },
    { id: "8.25x8.25", widthIn: 8.25, heightIn: 8.25 },
    { id: "8.5x8.5", widthIn: 8.5, heightIn: 8.5 },
    { id: "8.5x11", widthIn: 8.5, heightIn: 11 },
    { id: "8.27x11.69", widthIn: 8.27, heightIn: 11.69 },
  ]

  describe("getPageDimensions", () => {
    testCases.forEach(({ id, widthIn, heightIn }) => {
      it(`should return correct dimensions for ${id}`, () => {
        const dimensions = getPageDimensions(id)
        const expectedWidth = widthIn * 72
        const expectedHeight = heightIn * 72

        expect(dimensions.width).toBe(expectedWidth)
        expect(dimensions.height).toBe(expectedHeight)
      })

      it(`should convert ${id} dimensions correctly (inches * 72 = points)`, () => {
        const dimensions = getPageDimensions(id)
        
        expect(dimensions.width / 72).toBeCloseTo(widthIn, 2)
        expect(dimensions.height / 72).toBeCloseTo(heightIn, 2)
      })
    })

    it("should throw error for unknown trim size", () => {
      expect(() => getPageDimensions("invalid-size")).toThrow("Unknown trim size")
    })
  })

  describe("getTrimSizeLabel", () => {
    it("should return correct label for known trim sizes", () => {
      expect(getTrimSizeLabel("5x8")).toBe('5" × 8"')
      expect(getTrimSizeLabel("6x9")).toBe('6" × 9"')
      expect(getTrimSizeLabel("8.5x11")).toBe('8.5" × 11"')
    })

    it("should return 'Unknown' for invalid trim size", () => {
      expect(getTrimSizeLabel("invalid")).toBe("Unknown")
    })
  })

  describe("isValidTrimSize", () => {
    it("should return true for valid trim sizes", () => {
      expect(isValidTrimSize("5x8")).toBe(true)
      expect(isValidTrimSize("6x9")).toBe(true)
      expect(isValidTrimSize("8.5x11")).toBe(true)
    })

    it("should return false for invalid trim sizes", () => {
      expect(isValidTrimSize("invalid")).toBe(false)
      expect(isValidTrimSize("")).toBe(false)
    })
  })

  describe("KDP_TRIM_SIZES", () => {
    it("should have exactly 16 trim sizes", () => {
      expect(KDP_TRIM_SIZES).toHaveLength(16)
    })

    it("should have all required properties for each trim size", () => {
      KDP_TRIM_SIZES.forEach((size) => {
        expect(size).toHaveProperty("id")
        expect(size).toHaveProperty("label")
        expect(size).toHaveProperty("widthIn")
        expect(size).toHaveProperty("heightIn")
        expect(size).toHaveProperty("isLarge")
        expect(size).toHaveProperty("maxPages")
      })
    })

    it("should include common trim sizes", () => {
      const ids = KDP_TRIM_SIZES.map((s) => s.id)
      expect(ids).toContain("5x8")
      expect(ids).toContain("6x9")
      expect(ids).toContain("8.5x11")
      expect(ids).toContain("8.27x11.69") // A4
    })
  })

  describe("Dimension accuracy", () => {
    it("5x8 should produce 360x576 points (5*72 x 8*72)", () => {
      const dims = getPageDimensions("5x8")
      expect(dims.width).toBe(360)
      expect(dims.height).toBe(576)
    })

    it("6x9 should produce 432x648 points (6*72 x 9*72)", () => {
      const dims = getPageDimensions("6x9")
      expect(dims.width).toBe(432)
      expect(dims.height).toBe(648)
    })

    it("8.5x11 should produce 612x792 points (8.5*72 x 11*72)", () => {
      const dims = getPageDimensions("8.5x11")
      expect(dims.width).toBe(612)
      expect(dims.height).toBe(792)
    })
  })
})
