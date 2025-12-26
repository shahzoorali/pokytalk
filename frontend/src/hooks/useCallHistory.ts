import { useState, useEffect, useCallback } from 'react'
import { CallHistoryEntry } from '@/types'

const STORAGE_KEY = 'pokytalk_call_history'
const MAX_ENTRIES = 10

export function useCallHistory() {
  const [history, setHistory] = useState<CallHistoryEntry[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        const entries = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }))
        setHistory(entries)
      }
    } catch (error) {
      console.error('Error loading call history:', error)
      setHistory([])
    }
  }, [])

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving call history:', error)
    }
  }, [history])

  const addCallHistory = useCallback((entry: CallHistoryEntry) => {
    setHistory(prev => {
      // Remove existing entry with same partnerId (replace old with new)
      const filtered = prev.filter(e => e.partnerId !== entry.partnerId)
      
      // Add new entry at the beginning (most recent first)
      const updated = [entry, ...filtered]
      
      // Enforce 10-entry limit (FIFO - remove oldest)
      if (updated.length > MAX_ENTRIES) {
        return updated.slice(0, MAX_ENTRIES)
      }
      
      return updated
    })
  }, [])

  const getCallHistory = useCallback((): CallHistoryEntry[] => {
    // Already sorted by most recent (newest first)
    return history
  }, [history])

  const removeCallHistory = useCallback((partnerId: string) => {
    setHistory(prev => prev.filter(e => e.partnerId !== partnerId))
  }, [])

  const removeBlockedUsers = useCallback((blockedUserIds: string[]) => {
    setHistory(prev => prev.filter(e => !blockedUserIds.includes(e.partnerId)))
  }, [])

  const getHistoryEntry = useCallback((partnerId: string): CallHistoryEntry | undefined => {
    return history.find(e => e.partnerId === partnerId)
  }, [history])

  const clearCallHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing call history:', error)
    }
  }, [])

  return {
    history,
    addCallHistory,
    getCallHistory,
    removeCallHistory,
    removeBlockedUsers,
    getHistoryEntry,
    clearCallHistory,
  }
}



