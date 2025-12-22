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
  const callInProgressRef = useRef(false)
  const peerSessionRef = useRef<string | null>(null)
  
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
    connectionState,
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

  // Handle WebRTC signaling - simplified with trickle ICE enabled
  const handleWebRTCMessageCallback = useCallback((message: any) => {
    if (isUnmountingRef.current) return
    console.log('📨 Received WebRTC message:', {
      type: message.type,
      from: message.from,
      to: message.to,
      hasPeer: !!peer,
      peerDestroyed: peer?.destroyed
    })

    // Simply forward the message to the peer handler
    // Peer creation is handled in the main effect below
    handleWebRTCMessage(message)
  }, [peer, handleWebRTCMessage])

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

  // Track call state changes
  useEffect(() => {
    if (partner && sessionId) {
      callInProgressRef.current = true
      console.log('📞 Call in progress - preventing cleanup')
    } else if (!isWaiting) {
      callInProgressRef.current = false
      peerSessionRef.current = null
      console.log('📞 No call in progress')
    }
  }, [partner?.id, sessionId, isWaiting])

  // Create peer once per session - simplified flow
  useEffect(() => {
    const uid = user?.id
    const pid = partner?.id
    
    console.log('🔍 Peer creation check:', {
      uid,
      pid,
      sessionId,
      hasLocalStream: !!localStream,
      hasPeer: !!peer,
      peerSession: peerSessionRef.current,
      connectionState
    })
    
    if (!uid || !pid || !sessionId || !localStream) {
      if (uid && pid && sessionId) {
        console.log('⏳ Waiting for local stream before creating peer')
      }
      return
    }
    
    if (isUnmountingRef.current) return

    // Only create once per session
    if (peerSessionRef.current === sessionId) {
      console.log('⏭️ Peer already created for this session')
      return
    }

    // Determine initiator - prefer server-declared initiator
    const serverInitiatorId: string | undefined = (socket as any)?.__webrtcInitiatorId
    const isInitiator = serverInitiatorId ? uid === serverInitiatorId : uid < pid
    
    console.log('🎯 Creating WebRTC peer:', {
      isInitiator,
      initiatorId: isInitiator ? uid : pid,
      localStreamId: localStream.id,
      streamActive: localStream.active
    })
    
    const newPeer = createPeer(isInitiator, localStream, (data: any) => {
      if (isUnmountingRef.current) return
      
      // Handle SDP (offer/answer)
      if (data.type === 'offer' || data.type === 'answer') {
        console.log(`📤 Sending ${data.type} to partner`)
        sendWebRTCMessage({ type: data.type, sdp: data, from: uid, to: pid })
      } 
      // Handle ICE candidates (with trickle ICE enabled)
      else if (data.candidate) {
        const candidateData = {
          candidate: data.candidate.candidate,
          sdpMLineIndex: data.candidate.sdpMLineIndex,
          sdpMid: data.candidate.sdpMid
        }
        sendWebRTCMessage({ type: 'ice-candidate', candidate: candidateData, from: uid, to: pid })
      }
    })
    
    if (newPeer) {
      peerSessionRef.current = sessionId
      console.log('✅ Peer created and session tracked')
    } else {
      console.error('❌ Peer creation returned null')
    }
  }, [user?.id, partner?.id, sessionId, localStream, peer, connectionState, createPeer, sendWebRTCMessage, socket])

  // Handle connection state changes and retry logic
  useEffect(() => {
    if (connectionState === 'failed' && partner && sessionId && localStream) {
      console.log('🔄 Connection failed, attempting retry...')
      const retryTimeout = setTimeout(() => {
        if (!isUnmountingRef.current && connectionState === 'failed') {
          console.log('🔄 Retrying WebRTC connection...')
          peerSessionRef.current = null // Reset session to allow recreation
          cleanupWebRTC()
          
          // Recreate peer after cleanup
          setTimeout(() => {
            if (!isUnmountingRef.current && partner && sessionId && localStream) {
              const uid = user?.id
              const pid = partner?.id
              if (uid && pid) {
                const isInitiator = uid < pid
                const newPeer = createPeer(isInitiator, localStream)
                if (newPeer) {
                  peerSessionRef.current = sessionId
                  newPeer.on('signal', (data: any) => {
                    if (isUnmountingRef.current) return
                    console.log('📡 WebRTC signal generated (retry):', data.type || 'candidate')
                    if (data.type === 'offer' || data.type === 'answer') {
                      sendWebRTCMessage({ type: data.type, sdp: data, from: uid, to: pid })
                    } else if (data.candidate) {
                      // Format the candidate data properly for simple-peer
                      console.log('🧊 Sending ICE candidate (retry):', data.candidate)
                      const candidateData = {
                        candidate: data.candidate.candidate,
                        sdpMLineIndex: data.candidate.sdpMLineIndex,
                        sdpMid: data.candidate.sdpMid
                      }
                      sendWebRTCMessage({ type: 'ice-candidate', candidate: candidateData, from: uid, to: pid })
                    }
                  })
                }
              }
            }
          }, 1000)
        }
      }, 3000) // Wait 3 seconds before retrying

      return () => clearTimeout(retryTimeout)
    }
  }, [connectionState, partner, sessionId, localStream, user?.id, createPeer, sendWebRTCMessage, cleanupWebRTC])

  // Handle call ending
  useEffect(() => {
    if (!partner && peer && !isUnmountingRef.current) {
      console.log('📞 Partner disconnected, cleaning up WebRTC...')
      peerSessionRef.current = null
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
      console.log('🚀 Starting call...')
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
    
    console.log('📞 Ending call...')
    callInProgressRef.current = false
    peerSessionRef.current = null
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
          connectionState={connectionState}
          isMuted={isMuted}
          localAudioLevel={localAudioLevel}
          remoteAudioLevel={remoteAudioLevel}
          messages={messages}
          showChat={showFilters}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          onToggleChat={handleToggleChat}
          onSendMessage={sendMessage}
          remoteStream={remoteStream}
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
