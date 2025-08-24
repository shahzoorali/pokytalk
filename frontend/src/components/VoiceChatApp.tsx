'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  const isUnmountingRef = useRef(false)
  
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isUnmountingRef.current) {
        console.log('VoiceChatApp unmounting, cleaning up...')
        isUnmountingRef.current = true
        cleanupWebRTC()
      }
    }
  }, [cleanupWebRTC])

  // Initialize socket connection
  useEffect(() => {
    if (socket && !isConnected) {
      socket.connect()
    }
  }, [socket, isConnected])

  // Handle WebRTC signaling - use useCallback to prevent recreation
  const handleWebRTCMessageCallback = useCallback((message: any) => {
    if (!isUnmountingRef.current) {
      handleWebRTCMessage(message)
    }
  }, [handleWebRTCMessage])

  useEffect(() => {
    if (socket && !isUnmountingRef.current) {
      socket.on('webrtc:offer', handleWebRTCMessageCallback)
      socket.on('webrtc:answer', handleWebRTCMessageCallback)
      socket.on('webrtc:ice-candidate', handleWebRTCMessageCallback)
    }

    return () => {
      if (socket) {
        socket.off('webrtc:offer', handleWebRTCMessageCallback)
        socket.off('webrtc:answer', handleWebRTCMessageCallback)
        socket.off('webrtc:ice-candidate', handleWebRTCMessageCallback)
      }
    }
  }, [socket, handleWebRTCMessageCallback])

  // Handle call matching - use useCallback to prevent recreation
  const createPeerCallback = useCallback((isInitiator: boolean, stream: MediaStream) => {
    if (!isUnmountingRef.current) {
      return createPeer(isInitiator, stream)
    }
    return null
  }, [createPeer])

  const sendWebRTCMessageCallback = useCallback((message: any) => {
    if (!isUnmountingRef.current) {
      sendWebRTCMessage(message)
    }
  }, [sendWebRTCMessage])

  useEffect(() => {
    if (partner && sessionId && localStream && user?.id && !isUnmountingRef.current) {
      console.log('Creating WebRTC peer for call...')
      const isInitiator = user.id < partner.id
      const newPeer = createPeerCallback(isInitiator, localStream)
      
      if (newPeer) {
        newPeer.on('signal', (data: any) => {
          if (!isUnmountingRef.current) {
            if (data.type === 'offer' && data.sdp) {
              sendWebRTCMessageCallback({
                type: 'offer',
                sdp: data.sdp,
                from: user.id,
                to: partner.id,
              })
            } else if (data.type === 'answer' && data.sdp) {
              sendWebRTCMessageCallback({
                type: 'answer',
                sdp: data.sdp,
                from: user.id,
                to: partner.id,
              })
            } else if (data.candidate) {
              sendWebRTCMessageCallback({
                type: 'ice-candidate',
                candidate: data.candidate,
                from: user.id,
                to: partner.id,
              })
            }
          }
        })
      }
    }
  }, [partner, sessionId, localStream, user, createPeerCallback, sendWebRTCMessageCallback])

  // Handle call ending
  useEffect(() => {
    if (!partner && peer && !isUnmountingRef.current) {
      console.log('Partner disconnected, cleaning up WebRTC...')
      cleanupWebRTC()
    }
  }, [partner, peer, cleanupWebRTC])

  // Update audio levels
  useEffect(() => {
    if (isUnmountingRef.current) return

    const interval = setInterval(() => {
      if (!isUnmountingRef.current) {
        updateAudioLevel(localAudioLevel)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [localAudioLevel, updateAudioLevel])

  const handleStartCall = useCallback(async (userFilters?: UserFilters) => {
    if (isUnmountingRef.current) return
    
    try {
      console.log('Starting call...')
      await initializeAudio()
      setIsInitialized(true)
      setFilters(userFilters || {})
      requestCall(userFilters)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }, [initializeAudio, requestCall])

  const handleEndCall = useCallback(() => {
    if (isUnmountingRef.current) return
    
    console.log('Ending call...')
    endCall()
    cleanupWebRTC()
    setIsInitialized(false)
    setShowFilters(false)
  }, [endCall, cleanupWebRTC])

  const handleToggleMute = useCallback(() => {
    if (isUnmountingRef.current) return
    
    toggleWebRTCMute()
    toggleMute(!isMuted)
  }, [toggleWebRTCMute, toggleMute, isMuted])

  const handleToggleChat = useCallback(() => {
    if (isUnmountingRef.current) return
    
    setShowFilters(!showFilters)
    if (!showFilters && sessionId) {
      requestChatHistory()
    }
  }, [showFilters, sessionId, requestChatHistory])

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
