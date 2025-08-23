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
  sdp: string;
  from: string;
  to: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  from: string;
  to: string;
}

export interface WebRTCIceCandidate {
  type: 'ice-candidate';
  candidate: any; // RTCIceCandidateInit type
  from: string;
  to: string;
}

export type WebRTCMessage = WebRTCOffer | WebRTCAnswer | WebRTCIceCandidate;

export interface SocketEvents {
  // Connection events
  'user:connect': (user: User) => void;
  'user:disconnect': (userId: string) => void;
  
  // Call events
  'call:request': (filters: UserFilters) => void;
  'call:matched': (partner: User, sessionId: string) => void;
  'call:end': (sessionId: string) => void;
  'call:ended': (sessionId: string) => void;
  
  // WebRTC events
  'webrtc:offer': (offer: WebRTCOffer) => void;
  'webrtc:answer': (answer: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (candidate: WebRTCIceCandidate) => void;
  
  // Chat events
  'chat:message': (message: ChatMessage) => void;
  'chat:history': (messages: ChatMessage[]) => void;
  
  // Stats events
  'stats:update': (stats: ServerStats) => void;
  
  // Error events
  'error': (message: string) => void;
}
