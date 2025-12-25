'use client'

import { useEffect } from 'react'
import { X, Phone, PhoneOff } from 'lucide-react'
import { Flag } from './Flag'
import { getCountryName, formatRelativeTime } from '@/lib/utils'

interface CallbackRequestModalProps {
  isOpen: boolean
  requestId: string | null
  fromUserId: string | null
  fromCountry?: string
  originalCallTimestamp?: Date
  originalCallCountry?: string
  onAccept: (requestId: string) => void
  onDecline: (requestId: string) => void
  onClose: () => void
}

export function CallbackRequestModal({
  isOpen,
  requestId,
  fromUserId,
  fromCountry,
  originalCallTimestamp,
  originalCallCountry,
  onAccept,
  onDecline,
  onClose,
}: CallbackRequestModalProps) {
  // Auto-dismiss after 5 minutes (300 seconds) if not responded
  useEffect(() => {
    if (isOpen && requestId) {
      const timer = setTimeout(() => {
        console.log('⏰ Callback request expired, auto-dismissing')
        onDecline(requestId)
        onClose()
      }, 5 * 60 * 1000) // 5 minutes
      return () => clearTimeout(timer)
    }
  }, [isOpen, requestId, onDecline, onClose])

  if (!isOpen || !requestId) return null

  const handleAccept = () => {
    onAccept(requestId)
    onClose()
  }

  const handleDecline = () => {
    onDecline(requestId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border-2 border-primary-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Callback Request
                </h3>
                <p className="text-sm text-gray-400">Incoming request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            {fromCountry && (
              <div className="flex-shrink-0">
                <Flag countryCode={fromCountry} size={48} />
              </div>
            )}
            <div className="flex-1">
              <p className="text-gray-300 text-lg mb-2">
                Someone from{' '}
                <span className="text-white font-semibold">
                  {getCountryName(fromCountry)}
                </span>{' '}
                wants to call you back
              </p>
              {originalCallTimestamp && (
                <p className="text-sm text-gray-400">
                  Previous call:{' '}
                  <span className="text-gray-300">
                    {formatRelativeTime(originalCallTimestamp)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 text-center">
              This person wants to reconnect with you. Accept to start a new call
              or decline to dismiss.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-6 flex items-center space-x-3">
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            <Phone className="w-4 h-4" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  )
}
