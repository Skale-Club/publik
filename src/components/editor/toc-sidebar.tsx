"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react"
import { TOCEntry, type TOCEntryType } from "./toc-entry"
import type { Anchor } from "@/types/toc"
import {
  getTOCEntries,
  updateTOCEntry,
  reorderTOCEntriesAction,
  addTOCEntry,
  removeTOCEntryAction,
  syncTOC,
} from "@/server/actions/toc"

interface TOCSidebarProps {
  bookId: string
  anchors: Anchor[]
}

export function TOCSidebar({ bookId, anchors }: TOCSidebarProps) {
  const [entries, setEntries] = useState<TOCEntryType[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntryTitle, setNewEntryTitle] = useState("")
  const [newEntryLevel, setNewEntryLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load entries on mount
  useEffect(() => {
    loadEntries()
  }, [bookId])

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with editor anchors when they change — debounced to avoid write storms
  useEffect(() => {
    if (anchors.length === 0 || isLoading) return
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      handleSync()
    }, 1500)
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [anchors])

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const data = await getTOCEntries(bookId)
      setEntries(data)
    } catch (error) {
      console.error("Failed to load TOC entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      await syncTOC(bookId, anchors)
      await loadEntries()
    } catch (error) {
      console.error("Failed to sync TOC:", error)
    }
  }

  const handleUpdateEntry = async (id: string, title: string) => {
    try {
      const result = await updateTOCEntry(id, title)
      if (result.success && result.entry) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? result.entry! : e))
        )
      }
    } catch (error) {
      console.error("Failed to update entry:", error)
    }
  }

  const handleRemoveEntry = async (id: string) => {
    try {
      const result = await removeTOCEntryAction(id)
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (error) {
      console.error("Failed to remove entry:", error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setEntries((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update positions in the database
        const entryIds = newItems.map((i) => i.id)
        reorderTOCEntriesAction(bookId, entryIds)

        return newItems
      })
    }
  }

  const handleAddEntry = async () => {
    if (!newEntryTitle.trim()) return

    try {
      const result = await addTOCEntry(bookId, newEntryTitle.trim(), newEntryLevel)
      if (result.success && result.entry) {
        setEntries((prev) => [...prev, result.entry!])
        setNewEntryTitle("")
        setNewEntryLevel(1)
        setIsAdding(false)
      }
    } catch (error) {
      console.error("Failed to add entry:", error)
    }
  }

  const isLinkedToHeading = useCallback(
    (entry: TOCEntryType): boolean => {
      if (!entry.anchorId) return false
      return anchors.some((a) => a.id === entry.anchorId)
    },
    [anchors]
  )

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
          title="Expand TOC"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="mt-4 text-gray-400">
          <ListOrdered size={20} />
        </div>
        <span className="mt-2 text-xs text-gray-400 rotate-90 whitespace-nowrap">
          TOC
        </span>
      </div>
    )
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Table of Contents</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Collapse TOC"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Entry count */}
      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No TOC entries yet.
            <br />
            Add headings in the editor or create custom entries.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="py-2">
                {entries.map((entry) => (
                  <TOCEntry
                    key={entry.id}
                    entry={entry}
                    isLinkedToHeading={isLinkedToHeading(entry)}
                    onUpdate={handleUpdateEntry}
                    onRemove={handleRemoveEntry}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add custom entry */}
      <div className="border-t border-gray-200 p-3">
        {isAdding ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newEntryTitle}
              onChange={(e) => setNewEntryTitle(e.target.value)}
              placeholder="Entry title"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddEntry()
                if (e.key === "Escape") setIsAdding(false)
              }}
            />
            <div className="flex items-center gap-2">
              <select
                value={newEntryLevel}
                onChange={(e) => setNewEntryLevel(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
                <option value={5}>Level 5</option>
                <option value={6}>Level 6</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={!newEntryTitle.trim()}
                className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <Plus size={16} />
            Add Custom Entry
          </button>
        )}
      </div>
    </div>
  )
}
