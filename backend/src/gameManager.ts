import { v4 as uuidv4 } from 'uuid';
import { HangmanGame, HangmanGameState, HangmanGuessResult } from './types';

export class GameManager {
  private games: Map<string, HangmanGame> = new Map();
  private pendingInvites: Map<string, { fromUserId: string; toUserId: string; sessionId: string }> = new Map();

  // Create a new game invite
  createInvite(fromUserId: string, toUserId: string, sessionId: string): string {
    const inviteId = uuidv4();
    this.pendingInvites.set(inviteId, { fromUserId, toUserId, sessionId });
    return inviteId;
  }

  // Get pending invite
  getInvite(inviteId: string): { fromUserId: string; toUserId: string; sessionId: string } | undefined {
    return this.pendingInvites.get(inviteId);
  }

  // Remove invite
  removeInvite(inviteId: string): boolean {
    return this.pendingInvites.delete(inviteId);
  }

  // Get invite by session
  getInviteBySession(sessionId: string): { inviteId: string; fromUserId: string; toUserId: string; sessionId: string } | undefined {
    for (const [inviteId, invite] of this.pendingInvites.entries()) {
      if (invite.sessionId === sessionId) {
        return { inviteId, ...invite };
      }
    }
    return undefined;
  }

  // Create a new hangman game
  createGame(sessionId: string, setterId: string, guesserId: string): HangmanGame {
    const game: HangmanGame = {
      id: uuidv4(),
      callSessionId: sessionId,
      setterId,
      guesserId,
      word: '',
      maskedWord: '',
      guessedLetters: [],
      wrongGuesses: [],
      maxAttempts: 6,
      attemptsLeft: 6,
      state: 'word_setting',
      createdAt: new Date()
    };

    this.games.set(game.id, game);
    return game;
  }

  // Get game by ID
  getGame(gameId: string): HangmanGame | undefined {
    return this.games.get(gameId);
  }

  // Get active game for a session
  getGameBySession(sessionId: string): HangmanGame | undefined {
    for (const game of this.games.values()) {
      if (game.callSessionId === sessionId && game.state !== 'finished') {
        return game;
      }
    }
    return undefined;
  }

  // Set the word for the game
  setWord(gameId: string, word: string, category?: string): HangmanGame | undefined {
    const game = this.games.get(gameId);
    if (!game || game.state !== 'word_setting') return undefined;

    // Validate word (letters only, 3-15 characters)
    const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanWord.length < 3 || cleanWord.length > 15) return undefined;

    game.word = cleanWord;
    game.maskedWord = '_'.repeat(cleanWord.length);
    game.category = category;
    game.state = 'guessing';
    
    this.games.set(gameId, game);
    return game;
  }

  // Process a letter guess
  guessLetter(gameId: string, letter: string): HangmanGuessResult | undefined {
    const game = this.games.get(gameId);
    if (!game || game.state !== 'guessing') return undefined;

    const upperLetter = letter.toUpperCase();
    
    // Check if already guessed
    if (game.guessedLetters.includes(upperLetter)) {
      return {
        gameId,
        guess: upperLetter,
        isCorrect: false,
        maskedWord: game.maskedWord,
        guessedLetters: game.guessedLetters,
        wrongGuesses: game.wrongGuesses,
        attemptsLeft: game.attemptsLeft,
        isGameOver: false
      };
    }

    // Add to guessed letters
    game.guessedLetters.push(upperLetter);

    // Check if letter is in word
    const isCorrect = game.word.includes(upperLetter);
    
    if (isCorrect) {
      // Update masked word
      let newMasked = '';
      for (let i = 0; i < game.word.length; i++) {
        if (game.guessedLetters.includes(game.word[i])) {
          newMasked += game.word[i];
        } else {
          newMasked += '_';
        }
      }
      game.maskedWord = newMasked;
    } else {
      game.wrongGuesses.push(upperLetter);
      game.attemptsLeft--;
    }

    // Check for game over conditions
    const isWin = !game.maskedWord.includes('_');
    const isLoss = game.attemptsLeft <= 0;
    const isGameOver = isWin || isLoss;

    if (isGameOver) {
      game.state = 'finished';
      game.winner = isWin ? 'guesser' : 'setter';
    }

    this.games.set(gameId, game);

    return {
      gameId,
      guess: upperLetter,
      isCorrect,
      maskedWord: game.maskedWord,
      guessedLetters: game.guessedLetters,
      wrongGuesses: game.wrongGuesses,
      attemptsLeft: game.attemptsLeft,
      isGameOver,
      winner: game.winner,
      revealedWord: isGameOver ? game.word : undefined
    };
  }

  // Process a full word guess
  guessWord(gameId: string, word: string): HangmanGuessResult | undefined {
    const game = this.games.get(gameId);
    if (!game || game.state !== 'guessing') return undefined;

    const upperWord = word.toUpperCase().replace(/[^A-Z]/g, '');
    const isCorrect = upperWord === game.word;

    if (isCorrect) {
      // Player wins
      game.maskedWord = game.word;
      game.state = 'finished';
      game.winner = 'guesser';
    } else {
      // Wrong full word guess costs 2 attempts
      game.attemptsLeft = Math.max(0, game.attemptsLeft - 2);
      
      if (game.attemptsLeft <= 0) {
        game.state = 'finished';
        game.winner = 'setter';
      }
    }

    const isGameOver = game.state === 'finished';

    this.games.set(gameId, game);

    return {
      gameId,
      guess: upperWord,
      isCorrect,
      maskedWord: game.maskedWord,
      guessedLetters: game.guessedLetters,
      wrongGuesses: game.wrongGuesses,
      attemptsLeft: game.attemptsLeft,
      isGameOver,
      winner: game.winner,
      revealedWord: isGameOver ? game.word : undefined
    };
  }

  // End a game early
  endGame(gameId: string): HangmanGame | undefined {
    const game = this.games.get(gameId);
    if (!game) return undefined;

    game.state = 'finished';
    this.games.set(gameId, game);
    return game;
  }

  // Clean up games for a session (when call ends)
  cleanupSession(sessionId: string): void {
    // Remove any pending invites
    for (const [inviteId, invite] of this.pendingInvites.entries()) {
      if (invite.sessionId === sessionId) {
        this.pendingInvites.delete(inviteId);
      }
    }

    // End any active games
    for (const [gameId, game] of this.games.entries()) {
      if (game.callSessionId === sessionId) {
        game.state = 'finished';
        this.games.set(gameId, game);
      }
    }
  }

  // Get public game state (hide the word from guesser)
  getPublicGameState(game: HangmanGame, forUserId: string): Partial<HangmanGame> {
    const isGuesser = forUserId === game.guesserId;
    const hideWord = isGuesser && game.state !== 'finished';

    return {
      id: game.id,
      callSessionId: game.callSessionId,
      setterId: game.setterId,
      guesserId: game.guesserId,
      word: hideWord ? '' : game.word,
      maskedWord: game.maskedWord,
      category: game.category,
      guessedLetters: game.guessedLetters,
      wrongGuesses: game.wrongGuesses,
      maxAttempts: game.maxAttempts,
      attemptsLeft: game.attemptsLeft,
      state: game.state,
      winner: game.winner,
      createdAt: game.createdAt
    };
  }

  // Cleanup old finished games (call periodically)
  cleanupOldGames(): number {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [gameId, game] of this.games.entries()) {
      if (game.state === 'finished' && game.createdAt < oneHourAgo) {
        this.games.delete(gameId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}



