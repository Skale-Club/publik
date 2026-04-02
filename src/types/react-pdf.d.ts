import "@react-pdf/renderer"

declare module "@react-pdf/renderer" {
  interface TextProps {
    /** PDF bookmark navigation entry */
    bookmark?: {
      title: string
      fit?: boolean
      expanded?: boolean
      destination?: string
    }
    /** Element ID for internal link targets */
    id?: string
  }
}
