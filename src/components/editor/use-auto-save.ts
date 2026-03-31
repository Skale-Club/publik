"use client"

import { useEffect, useRef, useState } from "react"

type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutoSaveOptions {
  content: string
  onSave: (content: string) => Promise<void>
  delay?: number
}

export function useAutoSave({ content, onSave, delay = 800 }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>(content)
  const savePromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (content === lastSavedRef.current) {
      return
    }

    setStatus("idle")

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      setStatus("saving")
      try {
        await onSave(content)
        lastSavedRef.current = content
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch (error) {
        console.error("Auto-save failed:", error)
        setStatus("error")
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, onSave, delay])

  const retry = async () => {
    if (content !== lastSavedRef.current) {
      setStatus("saving")
      try {
        await onSave(content)
        lastSavedRef.current = content
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch (error) {
        setStatus("error")
      }
    }
  }

  return { status, retry }
}
