import { Server, Socket } from 'socket.io';
import { UserManager } from './userManager';
import { CallManager } from './callManager';
import { StatsManager } from './statsManager';
import { User, UserFilters, WebRTCMessage, ChatMessage } from '@pokytalk/shared';

export class SocketManager {
  constructor(
    private io: Server,
    private userManager: UserManager,
    private callManager: CallManager,
    private statsManager: StatsManager
  ) {
    this.setupSocketHandlers();
    this.startStatsUpdateInterval();
    this.startCleanupInterval();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 New connection: ${socket.id}`);

      // Handle user connection
      socket.on('user:connect', async (data: { age?: number; country?: string }) => {
        const user = this.userManager.createUser(socket.id, data.age, data.country);
        socket.data.userId = user.id;
        
        socket.emit('user:connect', user);
        this.updateStats();
        
        console.log(`👤 User connected: ${user.id} (Age: ${user.age}, Country: ${user.country})`);
      });

      // Handle call request
      socket.on('call:request', (filters: UserFilters) => {
        const userId = socket.data.userId;
        if (!userId) return;

        const user = this.userManager.getUser(userId);
        if (!user) return;

        // Add user to waiting queue
        this.userManager.addToQueue(userId);
        this.userManager.updateUser(userId, { isInCall: false, partnerId: undefined });

        // Try to find a partner
        const partner = this.userManager.getRandomPartner(userId, filters);
        
        if (partner) {
          // Remove both users from queue
          this.userManager.removeFromQueue(userId);
          this.userManager.removeFromQueue(partner.id);

          // Create call session
          const session = this.callManager.createSession(userId, partner.id);
          
          // Update user states
          this.userManager.updateUser(userId, { isInCall: true, partnerId: partner.id });
          this.userManager.updateUser(partner.id, { isInCall: true, partnerId: userId });

          // Notify both users
          socket.emit('call:matched', partner, session.id);
          this.io.to(partner.socketId).emit('call:matched', user, session.id);

          this.statsManager.incrementTotalSessions();
          this.updateStats();
          
          console.log(`📞 Call matched: ${user.id} ↔ ${partner.id} (Session: ${session.id})`);
        } else {
          socket.emit('call:waiting');
        }
      });

      // Handle call end
      socket.on('call:end', () => {
        const userId = socket.data.userId;
        if (!userId) return;

        const user = this.userManager.getUser(userId);
        if (!user || !user.partnerId) return;

        const session = this.callManager.getSessionByUser(userId);
        if (session) {
          this.callManager.endSession(session.id);
          
          // Notify partner
          const partner = this.userManager.getUser(user.partnerId);
          if (partner) {
            this.io.to(partner.socketId).emit('call:ended', session.id);
            this.userManager.updateUser(partner.id, { isInCall: false, partnerId: undefined });
          }
        }

        // Update user state
        this.userManager.updateUser(userId, { isInCall: false, partnerId: undefined });
        this.updateStats();
        
        console.log(`📞 Call ended: ${userId}`);
      });

      // Handle WebRTC signaling
      socket.on('webrtc:offer', (offer) => {
        const partner = this.userManager.getUser(offer.to);
        if (partner) {
          this.io.to(partner.socketId).emit('webrtc:offer', offer);
        }
      });

      socket.on('webrtc:answer', (answer) => {
        const partner = this.userManager.getUser(answer.to);
        if (partner) {
          this.io.to(partner.socketId).emit('webrtc:answer', answer);
        }
      });

      socket.on('webrtc:ice-candidate', (candidate) => {
        const partner = this.userManager.getUser(candidate.to);
        if (partner) {
          this.io.to(partner.socketId).emit('webrtc:ice-candidate', candidate);
        }
      });

      // Handle chat messages
      socket.on('chat:message', (data: { sessionId: string; content: string }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        const message = this.callManager.addMessage(data.sessionId, userId, data.content);
        if (message) {
          const partnerId = this.callManager.getPartnerId(data.sessionId, userId);
          if (partnerId) {
            const partner = this.userManager.getUser(partnerId);
            if (partner) {
              this.io.to(partner.socketId).emit('chat:message', message);
            }
          }
          socket.emit('chat:message', message);
        }
      });

      // Handle chat history request
      socket.on('chat:history', (sessionId: string) => {
        const messages = this.callManager.getSessionMessages(sessionId);
        socket.emit('chat:history', messages);
      });

      // Handle audio level updates
      socket.on('audio:level', (level: number) => {
        const userId = socket.data.userId;
        if (userId) {
          this.userManager.updateUser(userId, { audioLevel: level });
        }
      });

      // Handle mute toggle
      socket.on('audio:mute', (isMuted: boolean) => {
        const userId = socket.data.userId;
        if (userId) {
          this.userManager.updateUser(userId, { isMuted });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = socket.data.userId;
        if (userId) {
          const user = this.userManager.getUser(userId);
          if (user) {
            // End any active call
            if (user.isInCall && user.partnerId) {
              const session = this.callManager.getSessionByUser(userId);
              if (session) {
                this.callManager.endSession(session.id);
                
                const partner = this.userManager.getUser(user.partnerId);
                if (partner) {
                  this.io.to(partner.socketId).emit('call:ended', session.id);
                  this.userManager.updateUser(partner.id, { isInCall: false, partnerId: undefined });
                }
              }
            }

            // Remove user
            this.userManager.removeUser(userId);
            this.updateStats();
            
            console.log(`👤 User disconnected: ${userId}`);
          }
        }
      });
    });
  }

  private updateStats(): void {
    const connectedUsers = this.userManager.getConnectedUsers();
    const activeSessions = this.callManager.getActiveSessions();
    
    this.statsManager.updateOnlineUsers(connectedUsers.length);
    this.statsManager.updateActiveCalls(activeSessions.length);
    
    const stats = this.statsManager.getStats();
    this.io.emit('stats:update', stats);
  }

  private startStatsUpdateInterval(): void {
    setInterval(() => {
      this.updateStats();
    }, 5000); // Update stats every 5 seconds
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.callManager.cleanupInactiveSessions();
    }, 60000); // Cleanup every minute
  }
}
