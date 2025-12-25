export interface User {
  id: string;
  socketId: string;
  age?: number;
  country?: string;
  isConnected: boolean;
  isInCall: boolean;
  partnerId?: string;
  audioLevel: number;
  isMuted: boolean;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  sessionId: string;
}

export interface CallSession {
  id: string;
  user1Id: string;
  user2Id: string;
  startTime: Date;
  endTime?: Date;
  messages: ChatMessage[];
  isActive: boolean;
}

export interface UserFilters {
  minAge?: number;
  maxAge?: number;
  countries?: string[];
}

export interface ServerStats {
  onlineUsers: number;
  activeCalls: number;
  totalSessions: number;
}

export interface WebRTCOffer {
  type: 'offer';
  sdp: any;
  from: string;
  to: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: any;
  from: string;
  to: string;
}

export interface WebRTCIceCandidate {
  type: 'ice-candidate';
  candidate: any;
  from: string;
  to: string;
}

export type WebRTCMessage = WebRTCOffer | WebRTCAnswer | WebRTCIceCandidate;

// Hangman Game Types
export type HangmanGameState = 'pending' | 'word_setting' | 'guessing' | 'finished';
export type HangmanRole = 'setter' | 'guesser';

export interface HangmanGame {
  id: string;
  callSessionId: string;
  setterId: string;
  guesserId: string;
  word: string;
  maskedWord: string;
  category?: string;
  guessedLetters: string[];
  wrongGuesses: string[];
  maxAttempts: number;
  attemptsLeft: number;
  state: HangmanGameState;
  winner?: 'setter' | 'guesser';
  createdAt: Date;
}

export interface GameInvite {
  inviteId: string;
  fromUserId: string;
  sessionId: string;
  gameType: 'hangman';
}

export interface GameStarted {
  game: HangmanGame;
  role: HangmanRole;
}

export interface HangmanGuessResult {
  gameId: string;
  guess: string;
  isCorrect: boolean;
  maskedWord: string;
  guessedLetters: string[];
  wrongGuesses: string[];
  attemptsLeft: number;
  isGameOver: boolean;
  winner?: 'setter' | 'guesser';
  revealedWord?: string;
}

export interface GameEnded {
  game: HangmanGame;
  winner?: 'setter' | 'guesser';
  word: string;
  reason?: 'quit';
}

// Moderation Types
export type ReportReason = 
  | 'harassment' 
  | 'inappropriate_content' 
  | 'spam' 
  | 'scam' 
  | 'personal_info_request' 
  | 'other';

export interface ReportUserData {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  sessionId?: string;
}

// Call History Types
export interface CallHistoryEntry {
  partnerId: string;
  sessionId: string;
  timestamp: Date;
  duration: number; // in seconds
  country?: string;
}

export type CallbackRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface CallbackRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  timestamp: Date;
  status: CallbackRequestStatus;
  originalCallTimestamp?: Date;
  originalCallCountry?: string;
}

