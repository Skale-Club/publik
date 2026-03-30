export type BleedSetting = "bleed" | "no-bleed"

export interface MarginSet {
  insideIn: number
  outsideIn: number
  topIn: number
  bottomIn: number
}

export function getMargins(pageCount: number, bleed: BleedSetting): MarginSet {
  const outsideMin = bleed === "bleed" ? 0.375 : 0.25

  let inside: number
  if (pageCount <= 150) inside = 0.375
  else if (pageCount <= 300) inside = 0.5
  else if (pageCount <= 500) inside = 0.625
  else if (pageCount <= 700) inside = 0.75
  else inside = 0.875

  return {
    insideIn: inside,
    outsideIn: outsideMin,
    topIn: outsideMin,
    bottomIn: outsideMin,
  }
}
