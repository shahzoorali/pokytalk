'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Mic, MicOff, MessageSquare, X, Send } from 'lucide-react'
import { User, ChatMessage } from '@pokytalk/shared'
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
  remoteStream: MediaStream | null
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
  remoteStream,
}: CallScreenProps) {
  const [messageInput, setMessageInput] = useState('')
  const [callStartTime] = useState(new Date())
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
    <div className="min-h-screen bg-gray-900 flex">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className={`flex-1 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${isWebRTCConnected ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}></div>
            <span className="text-white font-medium">
              {isWebRTCConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            {formatTime(callStartTime)}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Connected</h2>
              <p className="text-gray-400">You're talking with someone</p>
            </div>
          </div>

          <div className="w-full max-w-md space-y-6">
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

      {showChat && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col md:hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.senderId === partner.id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === partner.id
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                maxLength={3000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div className="hidden md:block w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.senderId === partner.id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === partner.id
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                maxLength={3000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
