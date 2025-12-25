'use client'

import { ShieldOff, X } from 'lucide-react'

interface BlockDialogProps {
  isOpen: boolean
  partnerId: string | null
  onClose: () => void
  onBlock: (blockedUserId: string) => void
  onBlockAndReport: () => void
}

export function BlockDialog({
  isOpen,
  partnerId,
  onClose,
  onBlock,
  onBlockAndReport,
}: BlockDialogProps) {
  if (!isOpen || !partnerId) return null

  const handleBlock = () => {
    onBlock(partnerId)
    onClose()
  }

  const handleBlockAndReport = () => {
    onBlockAndReport()
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldOff className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-white">Block User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Blocking this user will:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-2">
            <li>Prevent them from sending you messages</li>
            <li>End the current call</li>
            <li>Prevent you from being matched with them again</li>
          </ul>
          <p className="text-gray-400 text-sm">
            You can also report this user for violating our community guidelines.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex flex-col space-y-2">
          <button
            onClick={handleBlockAndReport}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Block and Report
          </button>
          <button
            onClick={handleBlock}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Just Block
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

