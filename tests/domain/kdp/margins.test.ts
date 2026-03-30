import { describe, it, expect } from "vitest"
import { getMargins } from "../../../src/domain/kdp/margins"

describe("margins", () => {
  it("pageCount=24, bleed=no-bleed returns insideIn=0.375, outsideIn=0.25", () => {
    const margins = getMargins(24, "no-bleed")
    expect(margins.insideIn).toBe(0.375)
    expect(margins.outsideIn).toBe(0.25)
  })

  it("pageCount=150 returns insideIn=0.375", () => {
    const margins = getMargins(150, "no-bleed")
    expect(margins.insideIn).toBe(0.375)
  })

  it("pageCount=151 returns insideIn=0.5", () => {
    const margins = getMargins(151, "no-bleed")
    expect(margins.insideIn).toBe(0.5)
  })

  it("pageCount=300 returns insideIn=0.5", () => {
    const margins = getMargins(300, "no-bleed")
    expect(margins.insideIn).toBe(0.5)
  })

  it("pageCount=301 returns insideIn=0.625", () => {
    const margins = getMargins(301, "no-bleed")
    expect(margins.insideIn).toBe(0.625)
  })

  it("pageCount=500 returns insideIn=0.625", () => {
    const margins = getMargins(500, "no-bleed")
    expect(margins.insideIn).toBe(0.625)
  })

  it("pageCount=501 returns insideIn=0.75", () => {
    const margins = getMargins(501, "no-bleed")
    expect(margins.insideIn).toBe(0.75)
  })

  it("pageCount=700 returns insideIn=0.75", () => {
    const margins = getMargins(700, "no-bleed")
    expect(margins.insideIn).toBe(0.75)
  })

  it("pageCount=701 returns insideIn=0.875", () => {
    const margins = getMargins(701, "no-bleed")
    expect(margins.insideIn).toBe(0.875)
  })

  it("pageCount=828 returns insideIn=0.875", () => {
    const margins = getMargins(828, "no-bleed")
    expect(margins.insideIn).toBe(0.875)
  })

  it("bleed=bleed returns outsideIn=0.375", () => {
    const margins = getMargins(100, "bleed")
    expect(margins.outsideIn).toBe(0.375)
  })

  it("topIn and bottomIn always equal outsideIn", () => {
    const margins = getMargins(100, "bleed")
    expect(margins.topIn).toBe(margins.outsideIn)
    expect(margins.bottomIn).toBe(margins.outsideIn)
  })
})
