/**
 * TypeScript interfaces for Table of Contents functionality
 */

/**
 * TOC Entry - represents a single entry in the table of contents
 * Can be auto-generated from headings or custom user entries
 */
export interface TOCEntry {
  /** Unique identifier for the TOC entry */
  id: string
  /** ID of the book this TOC entry belongs to */
  bookId: string
  /** Display title of the TOC entry */
  title: string
  /** Heading level (1-6) */
  level: number
  /** ID of the anchor this entry links to (from TipTap heading) */
  anchorId: string | null
  /** Position/order of the entry in the TOC */
  position: number
  /** Whether this is a custom entry (not auto-generated from headings) */
  isCustom: boolean
  /** Timestamp when the entry was created */
  createdAt: Date
  /** Timestamp when the entry was last updated */
  updatedAt: Date
}

/**
 * Anchor - represents a heading extracted from the TipTap editor
 * These are the auto-generated anchors from the TableOfContents extension
 */
export interface Anchor {
  /** Unique ID for the anchor (slugified from heading text) */
  id: string
  /** The text content of the heading */
  textContent: string
  /** Heading level (1-6) */
  level: number
  /** Original heading level before any transformation */
  originalLevel: number
  /** Position of the heading in the document */
  pos: number
  /** Whether the heading is currently active/visible in the editor */
  isActive: boolean
  /** Whether the user has scrolled past this heading */
  isScrolledOver: boolean
}

/**
 * Result of syncing TOC with headings
 * Tracks what entries were added, updated, or removed
 */
export interface TOCSyncResult {
  /** Entries that were added (new headings found) */
  added: TOCEntry[]
  /** Entries that were updated (existing entries modified) */
  updated: TOCEntry[]
  /** Entries that were removed (headings no longer exist) */
  removed: TOCEntry[]
}

/**
 * Configuration options for the TableOfContents extension
 */
export interface TOCExtensionConfig {
  /** Node types to use for TOC generation */
  anchorTypes: string[]
  /** Function to generate hierarchical or linear indexes */
  getIndex: (level: number, prevLevel: number, index: number[]) => string
  /** Function to generate ID from heading content */
  getId: (content: string) => string
  /** Callback when TOC updates */
  onUpdate?: (anchors: Anchor[]) => void
}
