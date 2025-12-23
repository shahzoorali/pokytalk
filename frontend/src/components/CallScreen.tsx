'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Mic, MicOff, MessageSquare, X, Send } from 'lucide-react'
import { User, ChatMessage } from '@/types'
import { AudioLevelBar } from './AudioLevelBar'

interface CallScreenProps {
  partner: User
  isWebRTCConnected: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed'
  isMuted: boolean
  localAudioLevel: number
  remoteAudioLevel: number
  messages: ChatMessage[]
  showChat: boolean
  onEndCall: () => void
  onToggleMute: () => void
  onToggleChat: () => void
  onSendMessage: (content: string) => void
  remoteStream: MediaStream | null
}

export function CallScreen({
  partner,
  isWebRTCConnected,
  connectionState,
  isMuted,
  localAudioLevel,
  remoteAudioLevel,
  messages,
  showChat,
  onEndCall,
  onToggleMute,
  onToggleChat,
  onSendMessage,
  remoteStream,
}: CallScreenProps) {
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      try {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play().catch(() => {})
      } catch {
        // ignore
      }
    }
  }, [remoteStream])

  const handleSendMessage = () => {
    if (messageInput.trim() && messageInput.length <= 3000) {
      onSendMessage(messageInput.trim())
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gray-700/50 p-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 
              connectionState === 'failed' ? 'bg-red-500' : 'bg-gray-500'
            } rounded-full animate-pulse`}></div>
            <span className="text-white text-sm">
              {connectionState === 'connected' ? 'Connected' : 
               connectionState === 'connecting' ? 'Connecting...' : 
               connectionState === 'failed' ? 'Connection Failed' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={onEndCall}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main call content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Connected</h2>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">You</span>
                {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
              </div>
              <AudioLevelBar level={isMuted ? 0 : localAudioLevel} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Partner</span>
              </div>
              <AudioLevelBar level={remoteAudioLevel} />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={onEndCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleChat}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
        </div>
      </div>

        {/* Chat panel */}
      {showChat && (
          <div className="border-t border-gray-700 flex flex-col max-h-64">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">Chat</h3>
            <button onClick={onToggleChat} className="text-gray-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.senderId === partner.id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === partner.id
                      ? 'bg-gray-700 text-white'
                        : 'bg-primary-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

            <div className="p-3 border-t border-gray-700">
            <div className="flex space-x-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={1}
                maxLength={3000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
