"use client"

import { useEffect, useRef, useState } from "react"

type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutoSaveOptions {
  content: string
  onSave: (content: string) => Promise<void>
  delay?: number
  /** When this value changes, any pending save is cancelled and baseline is reset.
   *  Use the chapter ID so switching chapters never writes old content to the new one. */
  resetKey?: string
}

export function useAutoSave({
  content,
  onSave,
  delay = 800,
  resetKey,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(content)
  const onSaveRef = useRef(onSave)

  // Keep onSave ref current so the timeout closure always calls the latest version.
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // When the chapter changes: cancel any pending save and reset the baseline so
  // the auto-save effect doesn't immediately try to save the new chapter's content.
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    lastSavedRef.current = content
    setStatus("idle")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => {
    if (content === lastSavedRef.current) {
      return
    }

    setStatus("idle")

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      const contentToSave = content
      setStatus("saving")
      try {
        await onSaveRef.current(contentToSave)
        lastSavedRef.current = contentToSave
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch {
        setStatus("error")
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, delay])

  const retry = async () => {
    if (content !== lastSavedRef.current) {
      setStatus("saving")
      try {
        await onSaveRef.current(content)
        lastSavedRef.current = content
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch {
        setStatus("error")
      }
    }
  }

  return { status, retry }
}
