'use client'

import { useState, useCallback } from 'react'
import { X, Send, Gamepad2, Trophy, Skull, RotateCcw, HelpCircle } from 'lucide-react'
import { HangmanGame as HangmanGameType, HangmanRole, GameInvite, GameEnded } from '@/types'
import { GameStatus } from '@/hooks/useGame'

interface HangmanGameProps {
  // Game state
  gameStatus: GameStatus
  game: HangmanGameType | null
  role: HangmanRole | null
  pendingInvite: GameInvite | null
  gameResult: GameEnded | null
  error: string | null
  
  // Actions
  inviteToGame: () => void
  acceptInvite: () => void
  declineInvite: () => void
  setWord: (word: string, category?: string) => void
  guessLetter: (letter: string) => void
  guessWord: (word: string) => void
  endGame: () => void
  requestRematch: () => void
  acceptRematch: () => void
  resetGame: () => void
  clearError: () => void
  
  // UI control
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  'Animal',
  'Movie',
  'City',
  'Food',
  'Sport',
  'Music',
  'Other'
]

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]

// Hangman SVG component
function HangmanFigure({ wrongGuesses }: { wrongGuesses: number }) {
  return (
    <svg viewBox="0 0 200 250" className="w-32 h-40 mx-auto">
      {/* Gallows */}
      <line x1="20" y1="230" x2="100" y2="230" stroke="currentColor" strokeWidth="4" className="text-gray-400" />
      <line x1="60" y1="230" x2="60" y2="20" stroke="currentColor" strokeWidth="4" className="text-gray-400" />
      <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" className="text-gray-400" />
      <line x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="4" className="text-gray-400" />
      
      {/* Head */}
      {wrongGuesses >= 1 && (
        <circle cx="140" cy="70" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-red-400" />
      )}
      
      {/* Body */}
      {wrongGuesses >= 2 && (
        <line x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="4" className="text-red-400" />
      )}
      
      {/* Left Arm */}
      {wrongGuesses >= 3 && (
        <line x1="140" y1="110" x2="110" y2="130" stroke="currentColor" strokeWidth="4" className="text-red-400" />
      )}
      
      {/* Right Arm */}
      {wrongGuesses >= 4 && (
        <line x1="140" y1="110" x2="170" y2="130" stroke="currentColor" strokeWidth="4" className="text-red-400" />
      )}
      
      {/* Left Leg */}
      {wrongGuesses >= 5 && (
        <line x1="140" y1="150" x2="110" y2="190" stroke="currentColor" strokeWidth="4" className="text-red-400" />
      )}
      
      {/* Right Leg */}
      {wrongGuesses >= 6 && (
        <line x1="140" y1="150" x2="170" y2="190" stroke="currentColor" strokeWidth="4" className="text-red-400" />
      )}
    </svg>
  )
}

// Word display component
function WordDisplay({ maskedWord, isRevealed, actualWord }: { maskedWord: string; isRevealed?: boolean; actualWord?: string }) {
  const displayWord = isRevealed && actualWord ? actualWord : maskedWord
  
  return (
    <div className="flex justify-center gap-1.5 flex-wrap my-4">
      {displayWord.split('').map((char, index) => (
        <div
          key={index}
          className={`w-8 h-10 flex items-center justify-center border-b-2 ${
            char === '_' ? 'border-gray-500' : isRevealed ? 'border-green-500' : 'border-primary-500'
          }`}
        >
          <span className={`text-xl font-bold ${
            char === '_' ? 'text-transparent' : isRevealed ? 'text-green-400' : 'text-white'
          }`}>
            {char === '_' ? '.' : char}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HangmanGame({
  gameStatus,
  game,
  role,
  pendingInvite,
  gameResult,
  error,
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
  isOpen,
  onClose,
}: HangmanGameProps) {
  const [wordInput, setWordInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [fullWordGuess, setFullWordGuess] = useState('')
  const [showFullWordInput, setShowFullWordInput] = useState(false)

  const handleSetWord = useCallback(() => {
    if (wordInput.trim().length >= 3) {
      setWord(wordInput.trim(), categoryInput || undefined)
      setWordInput('')
      setCategoryInput('')
    }
  }, [wordInput, categoryInput, setWord])

  const handleGuessLetter = useCallback((letter: string) => {
    guessLetter(letter)
  }, [guessLetter])

  const handleGuessWord = useCallback(() => {
    if (fullWordGuess.trim().length >= 3) {
      guessWord(fullWordGuess.trim())
      setFullWordGuess('')
      setShowFullWordInput(false)
    }
  }, [fullWordGuess, guessWord])

  const handleClose = useCallback(() => {
    if (gameStatus === 'playing') {
      endGame()
    }
    resetGame()
    onClose()
  }, [gameStatus, endGame, resetGame, onClose])

  if (!isOpen) return null

  const isGuesser = role === 'guesser'
  const isSetter = role === 'setter'
  const wrongCount = game?.wrongGuesses.length || 0
  const isGameOver = game?.state === 'finished'
  const didGuessersWin = gameResult?.winner === 'guesser'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Hangman</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg mb-4 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="ml-2 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Idle state - Invite button */}
          {gameStatus === 'idle' && (
            <div className="text-center py-8">
              <Gamepad2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Play Hangman</h3>
              <p className="text-gray-400 text-sm mb-6">
                Challenge your partner to a game of Hangman!<br />
                One player sets a word, the other guesses.
              </p>
              <button
                onClick={inviteToGame}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Invite Partner to Play
              </button>
            </div>
          )}

          {/* Invite sent - Waiting */}
          {gameStatus === 'invite_sent' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">Invite Sent!</h3>
              <p className="text-gray-400 text-sm">
                Waiting for your partner to accept...
              </p>
            </div>
          )}

          {/* Invite received */}
          {gameStatus === 'invite_received' && pendingInvite && (
            <div className="text-center py-8">
              <Gamepad2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-white text-lg font-semibold mb-2">Game Invite!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Your partner wants to play Hangman with you!
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={declineInvite}
                  className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptInvite}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* Playing - Setter setting word */}
          {gameStatus === 'playing' && isSetter && game?.state === 'word_setting' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white text-lg font-semibold">Set Your Word</h3>
                <p className="text-gray-400 text-sm">
                  Choose a word for your partner to guess (3-15 letters)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Word</label>
                  <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="Enter word..."
                    maxLength={15}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg tracking-widest"
                  />
                  <p className="text-gray-500 text-xs mt-1">{wordInput.length}/15 characters</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category (optional)</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No hint</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSetWord}
                  disabled={wordInput.length < 3}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Set Word
                </button>
              </div>
            </div>
          )}

          {/* Playing - Setter waiting for guesses */}
          {gameStatus === 'playing' && isSetter && game?.state === 'guessing' && (
            <div className="py-4">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">Your word</p>
                <p className="text-2xl font-bold text-white tracking-widest my-2">{game.word}</p>
                {game.category && (
                  <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded">
                    {game.category}
                  </span>
                )}
              </div>

              <HangmanFigure wrongGuesses={wrongCount} />

              <div className="text-center my-4">
                <p className="text-gray-400 text-sm mb-1">Partner's progress</p>
                <WordDisplay maskedWord={game.maskedWord} />
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-gray-400 text-sm">
                  Attempts remaining: <span className="text-white font-bold">{game.attemptsLeft}/{game.maxAttempts}</span>
                </p>
                {game.wrongGuesses.length > 0 && (
                  <p className="text-red-400 text-xs mt-1">
                    Wrong: {game.wrongGuesses.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Playing - Guesser waiting for word */}
          {gameStatus === 'playing' && isGuesser && game?.state === 'word_setting' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">Get Ready!</h3>
              <p className="text-gray-400 text-sm">
                Your partner is choosing a word...
              </p>
            </div>
          )}

          {/* Playing - Guesser guessing */}
          {gameStatus === 'playing' && isGuesser && game?.state === 'guessing' && (
            <div className="py-2">
              {game.category && (
                <div className="text-center mb-2">
                  <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded">
                    Category: {game.category}
                  </span>
                </div>
              )}

              <HangmanFigure wrongGuesses={wrongCount} />

              <WordDisplay maskedWord={game.maskedWord} />

              <div className="text-center mb-3">
                <p className="text-gray-400 text-sm">
                  Attempts: <span className={`font-bold ${game.attemptsLeft <= 2 ? 'text-red-400' : 'text-white'}`}>
                    {game.attemptsLeft}/{game.maxAttempts}
                  </span>
                </p>
              </div>

              {/* Keyboard */}
              <div className="space-y-1.5 mb-3">
                {KEYBOARD_ROWS.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-1">
                    {row.map(letter => {
                      const isGuessed = game.guessedLetters.includes(letter)
                      const isWrong = game.wrongGuesses.includes(letter)
                      const isCorrect = isGuessed && !isWrong
                      
                      return (
                        <button
                          key={letter}
                          onClick={() => handleGuessLetter(letter)}
                          disabled={isGuessed}
                          className={`w-8 h-9 rounded font-bold text-sm transition-all ${
                            isCorrect
                              ? 'bg-green-600 text-white cursor-not-allowed'
                              : isWrong
                              ? 'bg-red-600/50 text-red-300 cursor-not-allowed'
                              : 'bg-gray-700 text-white hover:bg-purple-600'
                          }`}
                        >
                          {letter}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Full word guess */}
              {!showFullWordInput ? (
                <button
                  onClick={() => setShowFullWordInput(true)}
                  className="w-full py-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  Guess full word (risky: -2 attempts if wrong)
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fullWordGuess}
                    onChange={(e) => setFullWordGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="Enter full word..."
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <button
                    onClick={handleGuessWord}
                    disabled={fullWordGuess.length < 3}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowFullWordInput(false)
                      setFullWordGuess('')
                    }}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Game Over */}
          {gameStatus === 'ended' && gameResult && (
            <div className="text-center py-6">
              {didGuessersWin ? (
                <>
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-green-400 text-xl font-bold mb-2">
                    {isGuesser ? 'You Won!' : 'Guesser Won!'}
                  </h3>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Skull className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-red-400 text-xl font-bold mb-2">
                    {isSetter ? 'You Won!' : 'Game Over'}
                  </h3>
                </>
              )}

              <p className="text-gray-400 text-sm mb-2">The word was:</p>
              <WordDisplay 
                maskedWord={gameResult.word} 
                isRevealed={true} 
                actualWord={gameResult.word} 
              />

              {gameResult.reason === 'quit' && (
                <p className="text-yellow-400 text-sm mb-4">Game was ended early</p>
              )}

              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={requestRematch}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rematch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Quit button while playing */}
        {gameStatus === 'playing' && (
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={endGame}
              className="w-full py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              Quit Game
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


