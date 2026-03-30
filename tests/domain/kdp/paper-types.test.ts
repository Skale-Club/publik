import { describe, it, expect } from "vitest"
import { PAPER_INK_COMBOS } from "../../../src/domain/kdp/paper-types"

describe("paper-types", () => {
  it("PAPER_INK_COMBOS has exactly 4 entries", () => {
    expect(PAPER_INK_COMBOS).toHaveLength(4)
  })

  it("Standard color combo has minPages=72", () => {
    const standardColor = PAPER_INK_COMBOS.find((c) => c.key === "standard-color-white")
    expect(standardColor?.minPages).toBe(72)
  })

  it("All other combos have minPages=24", () => {
    PAPER_INK_COMBOS.forEach((combo) => {
      if (combo.key !== "standard-color-white") {
        expect(combo.minPages).toBe(24)
      }
    })
  })

  it("Cream paper only appears with B&W ink", () => {
    const creamCombos = PAPER_INK_COMBOS.filter((c) => c.paper === "cream")
    creamCombos.forEach((combo) => {
      expect(combo.ink).toBe("bw")
    })
  })

  it("Color ink only appears with white paper", () => {
    const colorCombos = PAPER_INK_COMBOS.filter((c) => c.ink === "standard-color" || c.ink === "premium-color")
    colorCombos.forEach((combo) => {
      expect(combo.paper).toBe("white")
    })
  })
})
