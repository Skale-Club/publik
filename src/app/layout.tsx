import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Publik",
  description: "Publish books to Amazon KDP",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
