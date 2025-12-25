'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'

interface NotificationModalProps {
  isOpen: boolean
  type: 'success' | 'warning' | 'error'
  title: string
  message: string
  onClose: () => void
}

export function NotificationModal({
  isOpen,
  type,
  title,
  message,
  onClose,
}: NotificationModalProps) {
  // Auto-dismiss after 5 seconds for non-critical notifications
  useEffect(() => {
    if (isOpen && type !== 'error') {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, type, onClose])

  if (!isOpen) return null

  const iconMap = {
    success: <CheckCircle className="w-8 h-8 text-green-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    error: <AlertCircle className="w-8 h-8 text-red-500" />,
  }

  const bgColorMap = {
    success: 'bg-green-900/20 border-green-700/50',
    warning: 'bg-yellow-900/20 border-yellow-700/50',
    error: 'bg-red-900/20 border-red-700/50',
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border-2 ${bgColorMap[type]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {iconMap[type]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">
                {title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

