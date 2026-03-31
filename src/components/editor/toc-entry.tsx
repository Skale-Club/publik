"use client"

import { useState } from "react"
import { GripVertical, Trash2, FileText, Link2 } from "lucide-react"
import { clsx } from "clsx"

export interface TOCEntryType {
  id: string
  bookId: string
  title: string
  level: number
  anchorId: string | null
  position: number
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

interface TOCEntryProps {
  entry: TOCEntryType
  isLinkedToHeading: boolean
  onUpdate: (id: string, title: string) => void
  onRemove: (id: string) => void
}

export function TOCEntry({ entry, isLinkedToHeading, onUpdate, onRemove }: TOCEntryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(entry.title)

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== entry.title) {
      onUpdate(entry.id, editTitle.trim())
    } else {
      setEditTitle(entry.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setEditTitle(entry.title)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  // Calculate indentation based on heading level
  const indentClass = {
    1: "pl-0",
    2: "pl-4",
    3: "pl-8",
    4: "pl-12",
    5: "pl-16",
    6: "pl-20",
  }[entry.level] || "pl-0"

  return (
    <div
      className={clsx(
        "group flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors",
        indentClass
      )}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical size={16} />
      </div>

      {/* Level indicator */}
      <span className="text-xs text-gray-400 font-medium w-4">
        {entry.level}
      </span>

      {/* Entry type indicator */}
      <div className="text-gray-400">
        {entry.isCustom || !isLinkedToHeading ? (
          <FileText size={14} className="text-blue-500" />
        ) : (
          <Link2 size={14} />
        )}
      </div>

      {/* Title - editable */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-gray-700 hover:text-gray-900 text-left truncate block w-full"
            title={entry.title}
          >
            {entry.title}
          </button>
        )}
      </div>

      {/* Custom entry badge */}
      {(entry.isCustom || !isLinkedToHeading) && (
        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          Custom
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={() => onRemove(entry.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
        title="Remove entry"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
