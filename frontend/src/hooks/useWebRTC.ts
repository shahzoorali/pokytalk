import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'simple-peer'
import { WebRTCMessage } from '@pokytalk/shared'

export function useWebRTC() {
  const [peer, setPeer] = useState<Peer.Instance | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [localAudioLevel, setLocalAudioLevel] = useState(0)
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null)
  const remoteDataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isCleaningUpRef = useRef(false)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isCleaningUpRef.current) {
        console.log('useWebRTC hook unmounting, cleaning up...')
        cleanup()
      }
    }
  }, [])

  const initializeAudio = useCallback(async () => {
    try {
      console.log('🎤 Initializing audio...')
      
      // Clean up any existing stream first
      if (localStream) {
        console.log('🧹 Cleaning up existing local stream')
        localStream.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      })

      console.log('✅ Audio stream obtained:', stream.getTracks().map(t => t.kind))
      setLocalStream(stream)

      // Set up audio analysis
      if (audioContextRef.current) {
        console.log('🧹 Cleaning up existing audio context')
        audioContextRef.current.close()
      }
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array

      // Start monitoring audio levels
      updateAudioLevel()

      console.log('✅ Audio initialization completed')
      return stream
    } catch (error) {
      console.error('❌ Error accessing microphone:', error)
      throw error
    }
  }, [localStream])

  const updateAudioLevel = useCallback(() => {
    if (isCleaningUpRef.current) return

    // Local level
    if (analyserRef.current && dataArrayRef.current) {
      // @ts-ignore
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i]
      }
      const average = sum / dataArrayRef.current.length
      const normalizedLevel = Math.min(average / 128, 1)
      setLocalAudioLevel(normalizedLevel)
      if (Math.random() < 0.01) {
        console.log('🎵 Local level:', normalizedLevel.toFixed(3))
      }
    }

    // Remote level
    if (remoteAnalyserRef.current) {
      const bins = remoteAnalyserRef.current.frequencyBinCount
      if (!remoteDataArrayRef.current || remoteDataArrayRef.current.length !== bins) {
        remoteDataArrayRef.current = new Uint8Array(bins)
      }
      // @ts-ignore
      remoteAnalyserRef.current.getByteFrequencyData(remoteDataArrayRef.current)
      let sumR = 0
      for (let i = 0; i < remoteDataArrayRef.current.length; i++) {
        sumR += remoteDataArrayRef.current[i]
      }
      const avgR = sumR / remoteDataArrayRef.current.length
      const normR = Math.min(avgR / 128, 1)
      setRemoteAudioLevel(normR)
      if (Math.random() < 0.01) {
        console.log('🎵 Remote level:', normR.toFixed(3))
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }, [])

  const createPeer = useCallback((initiator: boolean, stream: MediaStream) => {
    if (isCleaningUpRef.current) {
      console.log('⚠️ Skipping peer creation - cleanup in progress')
      return null
    }

    console.log(`🔗 Creating WebRTC peer (initiator: ${initiator})`)
    console.log('🎤 Stream info:', {
      id: stream.id,
      tracks: stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })),
      active: stream.active
    })
    
    // Clean up existing peer first
    if (peer) {
      console.log('🧹 Cleaning up existing peer')
      try {
        peer.destroy()
      } catch (error) {
        console.error('Error destroying existing peer:', error)
      }
    }

    // Enhanced ICE servers configuration
    const iceServers = [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      
      // Additional STUN servers for better connectivity
      { urls: 'stun:stun.voiparound.com:3478' },
      { urls: 'stun:stun.voipbuster.com:3478' },
      { urls: 'stun:stun.voipstunt.com:3478' },
      { urls: 'stun:stun.voxgratia.org:3478' },
      { urls: 'stun:stun.xten.com:3478' },
      
      // Free TURN servers (for NAT traversal when STUN fails)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]

    const newPeer = new Peer({
      initiator,
      stream,
      trickle: true, // Enable trickle ICE for faster connection
      config: {
        iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      },
      // Additional options for better connectivity
      objectMode: false
    })

    console.log('✅ Peer created successfully')
    setConnectionState('connecting')

    // Set connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }
    connectionTimeoutRef.current = setTimeout(() => {
      if (connectionState === 'connecting') {
        console.log('⏰ Connection timeout, retrying...')
        setConnectionState('failed')
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          console.log(`🔄 Retry attempt ${retryCountRef.current}/${maxRetries}`)
          // Trigger retry by destroying and recreating peer
          if (newPeer) {
            try {
              newPeer.destroy()
            } catch (error) {
              console.error('Error destroying peer on timeout:', error)
            }
          }
        } else {
          console.error('❌ Max retries reached, connection failed')
        }
      }
    }, 15000) // 15 second timeout

    newPeer.on('signal', (data) => {
      if (!isCleaningUpRef.current) {
        console.log('📡 Peer signal generated:', data.type || 'ice-candidate')
      }
    })

    newPeer.on('connect', () => {
      if (!isCleaningUpRef.current) {
        setIsConnected(true)
        setConnectionState('connected')
        retryCountRef.current = 0 // Reset retry count on successful connection
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        console.log('✅ WebRTC connected successfully')
      }
    })

    newPeer.on('stream', (stream) => {
      if (!isCleaningUpRef.current) {
        setRemoteStream(stream)
        console.log('📺 Remote stream received:', {
          id: stream.id,
          tracks: stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })),
          active: stream.active
        })

        // Set up remote analyser
        try {
          if (audioContextRef.current) {
            const remoteSource = audioContextRef.current.createMediaStreamSource(stream)
            remoteAnalyserRef.current = audioContextRef.current.createAnalyser()
            remoteAnalyserRef.current.fftSize = 256
            remoteSource.connect(remoteAnalyserRef.current)
          }
        } catch (e) {
          console.error('❌ Failed to set up remote analyser:', e)
        }
      }
    })

    newPeer.on('close', () => {
      if (!isCleaningUpRef.current) {
        setIsConnected(false)
        setRemoteStream(null)
        setConnectionState('disconnected')
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        console.log('🔌 WebRTC connection closed')
      }
    })

    newPeer.on('error', (error) => {
      console.error('❌ WebRTC error:', error)
      if (!isCleaningUpRef.current) {
        setConnectionState('failed')
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        
        // Auto-retry on certain errors
        if (retryCountRef.current < maxRetries && 
            (error.message.includes('ICE') || error.message.includes('connection'))) {
          retryCountRef.current++
          console.log(`🔄 Auto-retry on error (${retryCountRef.current}/${maxRetries})`)
          setTimeout(() => {
            if (!isCleaningUpRef.current) {
              // The component will handle recreating the peer
              console.log('🔄 Triggering peer recreation after error')
            }
          }, 2000)
        }
      }
    })

    // Monitor ICE connection state
    newPeer.on('iceStateChange', (state) => {
      console.log('🧊 ICE connection state:', state)
      if (state === 'failed' || state === 'disconnected') {
        setConnectionState('failed')
      } else if (state === 'connected' || state === 'completed') {
        setConnectionState('connected')
      }
    })

    setPeer(newPeer)
    return newPeer
  }, [peer, connectionState])

  const handleWebRTCMessage = useCallback((message: WebRTCMessage) => {
    if (!peer || isCleaningUpRef.current) {
      console.log('⚠️ Skipping WebRTC message - no peer or cleanup in progress')
      return
    }

    try {
      console.log('📨 Handling WebRTC message:', message.type)
      switch (message.type) {
        case 'offer':
          peer.signal(message.sdp)
          break
        case 'answer':
          peer.signal(message.sdp)
          break
        case 'ice-candidate':
          peer.signal(message.candidate)
          break
      }
    } catch (error) {
      console.error('❌ Error handling WebRTC message:', error)
    }
  }, [peer])

  const toggleMute = useCallback(() => {
    if (localStream && !isCleaningUpRef.current) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        console.log(`🔇 Mute toggled: ${!audioTrack.enabled}`)
      }
    }
  }, [localStream])

  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) {
      console.log('⚠️ Cleanup already in progress, skipping')
      return
    }

    console.log('🧹 Starting WebRTC cleanup...')
    isCleaningUpRef.current = true
    
    // Clean up connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    
    // Clean up peer connection
    if (peer) {
      try {
        console.log('🧹 Destroying peer connection')
        peer.destroy()
      } catch (error) {
        console.error('❌ Error destroying peer:', error)
      }
      setPeer(null)
    }
    
    // Clean up local stream
    if (localStream) {
      try {
        console.log('🧹 Stopping local stream tracks')
        localStream.getTracks().forEach(track => {
          track.stop()
        })
      } catch (error) {
        console.error('❌ Error stopping tracks:', error)
      }
      setLocalStream(null)
    }
    
    // Clean up remote stream
    if (remoteStream) {
      try {
        console.log('🧹 Stopping remote stream tracks')
        remoteStream.getTracks().forEach(track => {
          track.stop()
        })
      } catch (error) {
        console.error('❌ Error stopping remote tracks:', error)
      }
      setRemoteStream(null)
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      try {
        console.log('🧹 Closing audio context')
        audioContextRef.current.close()
      } catch (error) {
        console.error('❌ Error closing audio context:', error)
      }
      audioContextRef.current = null
    }
    
    // Reset analysers
    analyserRef.current = null
    dataArrayRef.current = null
    remoteAnalyserRef.current = null
    remoteDataArrayRef.current = null

    // Clean up animation frame
    if (animationFrameRef.current) {
      console.log('🧹 Cancelling animation frame')
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Reset state
    setIsConnected(false)
    setIsMuted(false)
    setLocalAudioLevel(0)
    setRemoteAudioLevel(0)
    setConnectionState('disconnected')
    retryCountRef.current = 0
    
    console.log('✅ WebRTC cleanup completed')
  }, [peer, localStream, remoteStream])

  return {
    peer,
    isConnected,
    localStream,
    remoteStream,
    isMuted,
    localAudioLevel,
    remoteAudioLevel,
    connectionState,
    initializeAudio,
    createPeer,
    handleWebRTCMessage,
    toggleMute,
    cleanup,
  }
}
