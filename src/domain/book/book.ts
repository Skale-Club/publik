export interface Book {
  id: string
  title: string
  description: string | null
  trimSizeId: string
  paperType: "white" | "cream"
  inkType: "bw" | "standard-color" | "premium-color"
  coverFinish: "glossy" | "matte"
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
