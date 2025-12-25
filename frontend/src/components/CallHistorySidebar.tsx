'use client'

import { useState, useRef, useEffect } from 'react'
import { X, History, Phone, Trash2 } from 'lucide-react'
import { CallHistoryEntry } from '@/types'
import { Flag } from './Flag'
import { getCountryName, formatRelativeTime, formatDuration } from '@/lib/utils'

interface CallHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  history: CallHistoryEntry[]
  onlineUsers: Set<string>
  blockedUsers: string[]
  onRequestCallback: (partnerId: string, originalCallTimestamp?: Date, originalCallCountry?: string) => void
  onClearHistory: () => void
}

export function CallHistorySidebar({
  isOpen,
  onClose,
  history,
  onlineUsers,
  blockedUsers,
  onRequestCallback,
  onClearHistory,
}: CallHistorySidebarProps) {
  const [isRequesting, setIsRequesting] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleRequestCallback = async (entry: CallHistoryEntry) => {
    if (isRequesting) return
    
    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    setIsRequesting(entry.partnerId)
    try {
      onRequestCallback(entry.partnerId, entry.timestamp, entry.country)
      // Reset after a short delay
      timeoutRef.current = setTimeout(() => setIsRequesting(null), 1000)
    } catch (error) {
      console.error('Failed to request callback:', error)
      setIsRequesting(null)
    }
  }

  const isOnline = (partnerId: string) => onlineUsers.has(partnerId)
  const isBlocked = (partnerId: string) => blockedUsers.includes(partnerId)

  // Filter out blocked users from history display
  const filteredHistory = history.filter(entry => !isBlocked(entry.partnerId))

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-800 border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 ${isOpen ? 'lg:block' : 'lg:hidden'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Call History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <History className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 text-sm">No call history yet</p>
                <p className="text-gray-500 text-xs mt-2">
                  Your recent calls will appear here
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredHistory.map((entry) => {
                  const online = isOnline(entry.partnerId)
                  const canCallback = online

                  return (
                    <div
                      key={`${entry.partnerId}-${entry.sessionId}`}
                      className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Country Flag */}
                        {entry.country && (
                          <div className="flex-shrink-0 mt-0.5">
                            <Flag countryCode={entry.country} size={24} />
                          </div>
                        )}

                        {/* Entry Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white text-sm font-medium">
                              {getCountryName(entry.country)}
                            </span>
                            {/* Online Status Dot */}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                online ? 'bg-green-500' : 'bg-gray-500'
                              }`}
                              title={online ? 'Online' : 'Offline'}
                            />
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{formatRelativeTime(entry.timestamp)}</span>
                            <span>•</span>
                            <span>{formatDuration(entry.duration)}</span>
                          </div>
                        </div>

                         {/* Call Back Button */}
                         <button
                           onClick={() => handleRequestCallback(entry)}
                           disabled={!canCallback || isRequesting === entry.partnerId}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            canCallback
                              ? 'bg-primary-600 hover:bg-primary-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !online
                              ? 'User is offline'
                              : 'Request callback'
                          }
                        >
                          {isRequesting === entry.partnerId ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Phone className="w-3 h-3 inline mr-1" />
                              Call Back
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredHistory.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={onClearHistory}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
