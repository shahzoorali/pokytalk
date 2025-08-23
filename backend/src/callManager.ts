import { v4 as uuidv4 } from 'uuid';
import { CallSession, ChatMessage, User } from '../../shared/src/types';

export class CallManager {
  private sessions: Map<string, CallSession> = new Map();

  createSession(user1Id: string, user2Id: string): CallSession {
    const session: CallSession = {
      id: uuidv4(),
      user1Id,
      user2Id,
      startTime: new Date(),
      messages: [],
      isActive: true
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): CallSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByUser(userId: string): CallSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.isActive && (session.user1Id === userId || session.user2Id === userId)) {
        return session;
      }
    }
    return undefined;
  }

  endSession(sessionId: string): CallSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  addMessage(sessionId: string, senderId: string, content: string): ChatMessage | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return undefined;

    const message: ChatMessage = {
      id: uuidv4(),
      senderId,
      content,
      timestamp: new Date(),
      sessionId
    };

    session.messages.push(message);
    this.sessions.set(sessionId, session);
    return message;
  }

  getSessionMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  getActiveSessions(): CallSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  cleanupInactiveSessions(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive && session.endTime && session.endTime < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }

  getPartnerId(sessionId: string, userId: string): string | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (session.user1Id === userId) return session.user2Id;
    if (session.user2Id === userId) return session.user1Id;
    return undefined;
  }
}
