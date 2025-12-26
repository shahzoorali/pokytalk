import { useCallback, useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { 
  HangmanGame, 
  HangmanRole, 
  GameInvite, 
  GameStarted, 
  HangmanGuessResult,
  GameEnded 
} from '@/types'

export type GameStatus = 'idle' | 'invite_sent' | 'invite_received' | 'playing' | 'ended'

interface UseGameProps {
  socket: Socket | null
  sessionId: string | null
  userId: string | null
}

export function useGame({ socket, sessionId, userId }: UseGameProps) {
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle')
  const [game, setGame] = useState<HangmanGame | null>(null)
  const [role, setRole] = useState<HangmanRole | null>(null)
  const [pendingInvite, setPendingInvite] = useState<GameInvite | null>(null)
  const [lastResult, setLastResult] = useState<HangmanGuessResult | null>(null)
  const [gameResult, setGameResult] = useState<GameEnded | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Listen to game events
  useEffect(() => {
    if (!socket) return

    // Invite received from partner
    const handleInvited = (data: GameInvite) => {
      console.log('🎮 Game invite received:', data)
      setPendingInvite(data)
      setGameStatus('invite_received')
      setError(null)
    }

    // Invite was sent successfully
    const handleInviteSent = (data: { inviteId: string; isRematch?: boolean }) => {
      console.log('🎮 Invite sent:', data)
      setGameStatus('invite_sent')
      setError(null)
    }

    // Partner declined invite
    const handleDeclined = (data: { inviteId: string }) => {
      console.log('🎮 Invite declined:', data)
      setGameStatus('idle')
      setError('Partner declined the game invite')
    }

    // Game started
    const handleStarted = (data: GameStarted) => {
      console.log('🎮 Game started:', data)
      setGame(data.game)
      setRole(data.role)
      setGameStatus('playing')
      setPendingInvite(null)
      setLastResult(null)
      setGameResult(null)
      setError(null)
    }

    // Word was set by setter
    const handleWordSet = (data: { game: HangmanGame }) => {
      console.log('🎮 Word set:', data)
      setGame(data.game)
    }

    // Guess result
    const handleGuessResult = (result: HangmanGuessResult) => {
      console.log('🎮 Guess result:', result)
      setLastResult(result)
      // Update game state from result
      setGame(prev => {
        if (!prev) return null
        return {
          ...prev,
          maskedWord: result.maskedWord,
          guessedLetters: result.guessedLetters,
          wrongGuesses: result.wrongGuesses,
          attemptsLeft: result.attemptsLeft,
          state: result.isGameOver ? 'finished' : prev.state,
          winner: result.winner
        }
      })
    }

    // Game ended
    const handleEnded = (data: GameEnded) => {
      console.log('🎮 Game ended:', data)
      setGameResult(data)
      setGameStatus('ended')
      setGame(data.game)
    }

    // Rematch invite received
    const handleRematchInvited = (data: GameInvite & { prevSetterId?: string }) => {
      console.log('🎮 Rematch invite received:', data)
      setPendingInvite({ ...data, gameType: 'hangman' })
      setGameStatus('invite_received')
    }

    // Error
    const handleError = (message: string) => {
      console.error('🎮 Game error:', message)
      setError(message)
    }

    socket.on('game:invited', handleInvited)
    socket.on('game:invite-sent', handleInviteSent)
    socket.on('game:declined', handleDeclined)
    socket.on('game:started', handleStarted)
    socket.on('game:word-set', handleWordSet)
    socket.on('game:guess-result', handleGuessResult)
    socket.on('game:ended', handleEnded)
    socket.on('game:rematch-invited', handleRematchInvited)
    socket.on('game:error', handleError)

    return () => {
      socket.off('game:invited', handleInvited)
      socket.off('game:invite-sent', handleInviteSent)
      socket.off('game:declined', handleDeclined)
      socket.off('game:started', handleStarted)
      socket.off('game:word-set', handleWordSet)
      socket.off('game:guess-result', handleGuessResult)
      socket.off('game:ended', handleEnded)
      socket.off('game:rematch-invited', handleRematchInvited)
      socket.off('game:error', handleError)
    }
  }, [socket])

  // Reset game state when session changes
  useEffect(() => {
    if (!sessionId) {
      setGameStatus('idle')
      setGame(null)
      setRole(null)
      setPendingInvite(null)
      setLastResult(null)
      setGameResult(null)
      setError(null)
    }
  }, [sessionId])

  // Invite partner to play
  const inviteToGame = useCallback(() => {
    if (!socket || !sessionId) return
    console.log('🎮 Sending game invite for session:', sessionId)
    socket.emit('game:invite', { sessionId, gameType: 'hangman' })
  }, [socket, sessionId])

  // Accept an invite
  const acceptInvite = useCallback(() => {
    if (!socket || !pendingInvite) return
    console.log('🎮 Accepting invite:', pendingInvite.inviteId)
    socket.emit('game:accept', { inviteId: pendingInvite.inviteId })
  }, [socket, pendingInvite])

  // Decline an invite
  const declineInvite = useCallback(() => {
    if (!socket || !pendingInvite) return
    console.log('🎮 Declining invite:', pendingInvite.inviteId)
    socket.emit('game:decline', { inviteId: pendingInvite.inviteId })
    setPendingInvite(null)
    setGameStatus('idle')
  }, [socket, pendingInvite])

  // Set the word (setter only)
  const setWord = useCallback((word: string, category?: string) => {
    if (!socket || !game) return
    console.log('🎮 Setting word:', word, 'Category:', category)
    socket.emit('game:set-word', { gameId: game.id, word, category })
  }, [socket, game])

  // Guess a letter (guesser only)
  const guessLetter = useCallback((letter: string) => {
    if (!socket || !game) return
    console.log('🎮 Guessing letter:', letter)
    socket.emit('game:guess', { gameId: game.id, guess: letter, isFullWordGuess: false })
  }, [socket, game])

  // Guess the full word (guesser only)
  const guessWord = useCallback((word: string) => {
    if (!socket || !game) return
    console.log('🎮 Guessing word:', word)
    socket.emit('game:guess', { gameId: game.id, guess: word, isFullWordGuess: true })
  }, [socket, game])

  // End game early
  const endGame = useCallback(() => {
    if (!socket || !game) return
    console.log('🎮 Ending game:', game.id)
    socket.emit('game:end', { gameId: game.id })
  }, [socket, game])

  // Request rematch
  const requestRematch = useCallback(() => {
    if (!socket || !sessionId) return
    console.log('🎮 Requesting rematch')
    socket.emit('game:rematch', { sessionId })
  }, [socket, sessionId])

  // Accept rematch
  const acceptRematch = useCallback(() => {
    if (!socket || !pendingInvite || !game) return
    console.log('🎮 Accepting rematch')
    socket.emit('game:rematch-accept', { 
      inviteId: pendingInvite.inviteId, 
      prevSetterId: game.setterId 
    })
  }, [socket, pendingInvite, game])

  // Reset game state
  const resetGame = useCallback(() => {
    setGameStatus('idle')
    setGame(null)
    setRole(null)
    setPendingInvite(null)
    setLastResult(null)
    setGameResult(null)
    setError(null)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    gameStatus,
    game,
    role,
    pendingInvite,
    lastResult,
    gameResult,
    error,
    
    // Computed
    isPlaying: gameStatus === 'playing',
    isSetter: role === 'setter',
    isGuesser: role === 'guesser',
    isWaitingForWord: game?.state === 'word_setting',
    isGuessing: game?.state === 'guessing',
    isGameOver: game?.state === 'finished',
    
    // Actions
    inviteToGame,
    acceptInvite,
    declineInvite,
    setWord,
    guessLetter,
    guessWord,
    endGame,
    requestRematch,
    acceptRematch,
    resetGame,
    clearError,
  }
}





