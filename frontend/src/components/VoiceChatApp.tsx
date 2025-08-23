'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { ConnectionScreen } from './ConnectionScreen'
import { CallScreen } from './CallScreen'
import { LoadingScreen } from './LoadingScreen'
import { UserFilters } from '@pokytalk/shared'

export function VoiceChatApp() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({})
  
  const {
    socket,
    isConnected,
    user,
    stats,
    isWaiting,
    partner,
    sessionId,
    messages,
    connectUser,
    requestCall,
    endCall,
    sendMessage,
    requestChatHistory,
    sendWebRTCMessage,
    updateAudioLevel,
    toggleMute,
  } = useSocket()

  const {
    peer,
    isConnected: isWebRTCConnected,
    localStream,
    remoteStream,
    isMuted,
    localAudioLevel,
    remoteAudioLevel,
    initializeAudio,
    createPeer,
    handleWebRTCMessage,
    toggleMute: toggleWebRTCMute,
    cleanup: cleanupWebRTC,
  } = useWebRTC()

  // Initialize socket connection
  useEffect(() => {
    if (socket && !isConnected) {
      socket.connect()
    }
  }, [socket, isConnected])

  // Handle WebRTC signaling
  useEffect(() => {
    if (socket) {
      socket.on('webrtc:offer', handleWebRTCMessage)
      socket.on('webrtc:answer', handleWebRTCMessage)
      socket.on('webrtc:ice-candidate', handleWebRTCMessage)
    }
  }, [socket, handleWebRTCMessage])

  // Handle call matching
  useEffect(() => {
    if (partner && sessionId && localStream) {
      const isInitiator = user?.id < partner.id
      const newPeer = createPeer(isInitiator, localStream)
      
      newPeer.on('signal', (data) => {
        if (data.type === 'offer') {
          sendWebRTCMessage({
            type: 'offer',
            sdp: data.sdp,
            from: user!.id,
            to: partner.id,
          })
        } else if (data.type === 'answer') {
          sendWebRTCMessage({
            type: 'answer',
            sdp: data.sdp,
            from: user!.id,
            to: partner.id,
          })
        } else if (data.candidate) {
          sendWebRTCMessage({
            type: 'ice-candidate',
            candidate: data.candidate,
            from: user!.id,
            to: partner.id,
          })
        }
      })
    }
  }, [partner, sessionId, localStream, user, createPeer, sendWebRTCMessage])

  // Handle call ending
  useEffect(() => {
    if (!partner && peer) {
      cleanupWebRTC()
    }
  }, [partner, peer, cleanupWebRTC])

  // Update audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      updateAudioLevel(localAudioLevel)
    }, 100)

    return () => clearInterval(interval)
  }, [localAudioLevel, updateAudioLevel])

  const handleStartCall = async (userFilters?: UserFilters) => {
    try {
      await initializeAudio()
      setIsInitialized(true)
      setFilters(userFilters || {})
      requestCall(userFilters)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const handleEndCall = () => {
    endCall()
    cleanupWebRTC()
    setIsInitialized(false)
    setShowFilters(false)
  }

  const handleToggleMute = () => {
    toggleWebRTCMute()
    toggleMute(!isMuted)
  }

  const handleToggleChat = () => {
    setShowFilters(!showFilters)
    if (!showFilters && sessionId) {
      requestChatHistory()
    }
  }

  if (!isConnected) {
    return <LoadingScreen message="Connecting to server..." />
  }

  if (!isInitialized) {
    return (
      <ConnectionScreen
        onStartCall={handleStartCall}
        stats={stats}
      />
    )
  }

  if (isWaiting) {
    return <LoadingScreen message="Finding someone to talk to..." />
  }

  if (partner && sessionId) {
    return (
      <CallScreen
        partner={partner}
        isWebRTCConnected={isWebRTCConnected}
        isMuted={isMuted}
        localAudioLevel={localAudioLevel}
        remoteAudioLevel={remoteAudioLevel}
        messages={messages}
        showChat={showFilters}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleChat={handleToggleChat}
        onSendMessage={sendMessage}
      />
    )
  }

  // If we're initialized but not in a call, show connection screen
  return (
    <ConnectionScreen
      onStartCall={handleStartCall}
      stats={stats}
    />
  )
}
