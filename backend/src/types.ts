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
  fromUserId: string;
  toUserId: string;
  sessionId: string;
  gameType: 'hangman';
}

export interface HangmanSetWordData {
  gameId: string;
  word: string;
  category?: string;
}

export interface HangmanGuessData {
  gameId: string;
  guess: string; // single letter or full word
  isFullWordGuess: boolean;
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

export interface HangmanGameUpdate {
  game: HangmanGame;
  event: 'word_set' | 'guess_result' | 'game_ended';
}

// Moderation Types
export type ReportReason = 
  | 'harassment' 
  | 'inappropriate_content' 
  | 'spam' 
  | 'scam' 
  | 'personal_info_request' 
  | 'other';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  sessionId?: string;
  timestamp: Date;
  reviewed: boolean;
  actionTaken?: 'warning' | 'suspension' | 'ban' | 'none';
}

export interface BlockedUser {
  blockerId: string;
  blockedUserId: string;
  timestamp: Date;
}

export interface ReportUserData {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  sessionId?: string;
}

// Call History and Callback Types
export interface CallbackRequestData {
  toUserId: string;
  originalCallTimestamp?: Date;
  originalCallCountry?: string;
}

export interface CallbackRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  originalCallTimestamp?: Date;
  originalCallCountry?: string;
}

export interface CallbackRequestResponse {
  requestId: string;
  status: 'accepted' | 'declined' | 'expired';
  message?: string;
}

