"use client"

import Image from "next/image"

interface CoverPreviewProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function CoverPreview({ src, alt, width = 200, height = 300, className = "" }: CoverPreviewProps) {
  if (!src) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">No cover</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes={`${width}px`}
      />
    </div>
  )
}
