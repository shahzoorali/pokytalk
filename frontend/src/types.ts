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

