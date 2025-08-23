'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Mic, MicOff, MessageSquare, X, Send } from 'lucide-react'
import { User, ChatMessage } from '../../../shared/src/types'
import { formatTime } from '@/lib/utils'
import { AudioLevelBar } from './AudioLevelBar'

interface CallScreenProps {
  partner: User
  isWebRTCConnected: boolean
  isMuted: boolean
  localAudioLevel: number
  remoteAudioLevel: number
  messages: ChatMessage[]
  showChat: boolean
  onEndCall: () => void
  onToggleMute: () => void
  onToggleChat: () => void
  onSendMessage: (content: string) => void
}

export function CallScreen({
  partner,
  isWebRTCConnected,
  isMuted,
  localAudioLevel,
  remoteAudioLevel,
  messages,
  showChat,
  onEndCall,
  onToggleMute,
  onToggleChat,
  onSendMessage,
}: CallScreenProps) {
  const [messageInput, setMessageInput] = useState('')
  const [callStartTime] = useState(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (messageInput.trim() && messageInput.length <= 3000) {
      onSendMessage(messageInput.trim())
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Call Area */}
      <div className={`flex-1 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              {isWebRTCConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            {formatTime(callStartTime)}
          </div>
        </div>

        {/* Call Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          {/* Partner Info */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Connected</h2>
              <p className="text-gray-400">You're talking with someone</p>
            </div>
          </div>

          {/* Audio Level Indicators */}
          <div className="w-full max-w-md space-y-6">
            {/* Local Audio Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">You</span>
                <div className="flex items-center space-x-2">
                  {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
                  <span className="text-gray-400">
                    {Math.round(localAudioLevel * 100)}%
                  </span>
                </div>
              </div>
              <AudioLevelBar level={isMuted ? 0 : localAudioLevel} />
            </div>

            {/* Remote Audio Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Partner</span>
                <span className="text-gray-400">
                  {Math.round(remoteAudioLevel * 100)}%
                </span>
              </div>
              <AudioLevelBar level={remoteAudioLevel} />
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={onEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={onToggleChat}
              className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors md:hidden"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-full md:w-80 bg-gray-800 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-medium">Text Chat</h3>
            <button
              onClick={onToggleChat}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.senderId === 'me'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                maxLength={3000}
                className="flex-1 input-field resize-none h-12 py-2"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {messageInput.length}/3000
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button (Desktop) */}
      {!showChat && (
        <button
          onClick={onToggleChat}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hidden md:flex"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
