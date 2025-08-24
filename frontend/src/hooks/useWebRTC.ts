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
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isCleaningUpRef = useRef(false)

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
    if (!analyserRef.current || !dataArrayRef.current || isCleaningUpRef.current) return

    // @ts-ignore
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    let sum = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i]
    }
    const average = sum / dataArrayRef.current.length
    const normalizedLevel = Math.min(average / 128, 1) // Normalize to 0-1
    
    setLocalAudioLevel(normalizedLevel)
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }, [])

  const createPeer = useCallback((initiator: boolean, stream: MediaStream) => {
    if (isCleaningUpRef.current) {
      console.log('⚠️ Skipping peer creation - cleanup in progress')
      return null
    }

    console.log(`🔗 Creating WebRTC peer (initiator: ${initiator})`)
    
    // Clean up existing peer first
    if (peer) {
      console.log('🧹 Cleaning up existing peer')
      try {
        peer.destroy()
      } catch (error) {
        console.error('Error destroying existing peer:', error)
      }
    }

    const newPeer = new Peer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    })

    console.log('✅ Peer created successfully')

    newPeer.on('signal', (data) => {
      if (!isCleaningUpRef.current) {
        console.log('📡 Peer signal generated:', data.type || 'ice-candidate')
      }
    })

    newPeer.on('connect', () => {
      if (!isCleaningUpRef.current) {
        setIsConnected(true)
        console.log('✅ WebRTC connected successfully')
      }
    })

    newPeer.on('stream', (stream) => {
      if (!isCleaningUpRef.current) {
        setRemoteStream(stream)
        console.log('📺 Remote stream received')
      }
    })

    newPeer.on('close', () => {
      if (!isCleaningUpRef.current) {
        setIsConnected(false)
        setRemoteStream(null)
        console.log('🔌 WebRTC connection closed')
      }
    })

    newPeer.on('error', (error) => {
      console.error('❌ WebRTC error:', error)
      if (!isCleaningUpRef.current) {
        // Don't auto-cleanup on error, let the component handle it
        console.log('⚠️ WebRTC error occurred, but not cleaning up automatically')
      }
    })

    setPeer(newPeer)
    return newPeer
  }, [peer])

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
    initializeAudio,
    createPeer,
    handleWebRTCMessage,
    toggleMute,
    cleanup,
  }
}
