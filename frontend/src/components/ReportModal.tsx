'use client'

import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { ReportUserData, ReportReason } from '@/types'

interface ReportModalProps {
  isOpen: boolean
  partnerId: string | null
  sessionId: string | null
  onClose: () => void
  onReport: (data: ReportUserData) => void
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or repeated unwanted contact'
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Sexual, violent, or offensive content'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive or unwanted messages'
  },
  {
    value: 'scam',
    label: 'Scam',
    description: 'Attempting to defraud or deceive'
  },
  {
    value: 'personal_info_request',
    label: 'Requesting Personal Information',
    description: 'Asking for personal details, location, or contact info'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other violation of community guidelines'
  },
]

export function ReportModal({
  isOpen,
  partnerId,
  sessionId,
  onClose,
  onReport,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !partnerId) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReason) {
      return
    }

    setIsSubmitting(true)
    
    const reportData: ReportUserData = {
      reportedUserId: partnerId,
      reason: selectedReason as ReportReason,
      description: description.trim() || undefined,
      sessionId: sessionId || undefined,
    }

    onReport(reportData)
    
    // Reset form
    setSelectedReason('')
    setDescription('')
    setIsSubmitting(false)
    onClose()
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('')
      setDescription('')
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-white">Report User</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            <p className="text-gray-300 text-sm">
              Please select a reason for reporting this user. Your report will be reviewed by our moderation team.
            </p>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reason for Report <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedReason === reason.value
                        ? 'border-primary-500 bg-primary-600/20'
                        : 'border-gray-700 bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        selectedReason === reason.value
                          ? 'border-primary-400 bg-primary-500'
                          : 'border-gray-500'
                      }`}>
                        {selectedReason === reason.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{reason.label}</div>
                        <div className="text-gray-400 text-xs mt-1">{reason.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context about this report..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/500 characters
              </p>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

