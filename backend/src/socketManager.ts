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
      console.log(`🔌 New connection: ${socket.id} from ${socket.handshake.address}`);

      // Handle user connection
      socket.on('user:connect', async (data: { age?: number; country?: string }) => {
        console.log(`📝 User connect request from ${socket.id}:`, data);
        
        try {
          const user = this.userManager.createUser(socket.id, data.age, data.country);
          socket.data.userId = user.id;
          
          socket.emit('user:connect', user);
          this.updateStats();
          
          console.log(`✅ User connected successfully: ${user.id} (Age: ${user.age}, Country: ${user.country})`);
        } catch (error) {
          console.error(`❌ Error creating user for ${socket.id}:`, error);
        }
      });

      // Handle call request
      socket.on('call:request', (filters: UserFilters) => {
        const userId = socket.data.userId;
        console.log(`📞 Call request from ${userId} (${socket.id}) with filters:`, filters);
        
        if (!userId) {
          console.error(`❌ No userId found for socket ${socket.id}`);
          return;
        }

        const user = this.userManager.getUser(userId);
        if (!user) {
          console.error(`❌ User not found: ${userId}`);
          return;
        }

        // Add user to waiting queue
        this.userManager.addToQueue(userId);
        this.userManager.updateUser(userId, { isInCall: false, partnerId: undefined });
        console.log(`⏳ User ${userId} added to waiting queue`);

        // Try to find a partner
        const partner = this.userManager.getRandomPartner(userId, filters);
        
        if (partner) {
          console.log(`🎯 Found partner for ${userId}: ${partner.id}`);
          
          // Remove both users from queue
          this.userManager.removeFromQueue(userId);
          this.userManager.removeFromQueue(partner.id);

          // Create call session
          const session = this.callManager.createSession(userId, partner.id);
          console.log(`📋 Created session: ${session.id} for ${userId} ↔ ${partner.id}`);
          
          // Update user states
          this.userManager.updateUser(userId, { isInCall: true, partnerId: partner.id });
          this.userManager.updateUser(partner.id, { isInCall: true, partnerId: userId });

          // Notify both users
          socket.emit('call:matched', partner, session.id);
          this.io.to(partner.socketId).emit('call:matched', user, session.id);

          this.statsManager.incrementTotalSessions();
          this.updateStats();
          
          console.log(`✅ Call matched successfully: ${user.id} ↔ ${partner.id} (Session: ${session.id})`);
        } else {
          console.log(`⏳ No partner found for ${userId}, user will wait`);
          socket.emit('call:waiting');
        }
      });

      // Handle call end
      socket.on('call:end', () => {
        const userId = socket.data.userId;
        console.log(`📞 Call end request from ${userId} (${socket.id})`);
        
        if (!userId) {
          console.error(`❌ No userId found for socket ${socket.id}`);
          return;
        }

        const user = this.userManager.getUser(userId);
        if (!user) {
          console.error(`❌ User not found: ${userId}`);
          return;
        }

        if (!user.partnerId) {
          console.log(`⚠️ User ${userId} has no partner, removing from queue`);
          this.userManager.removeFromQueue(userId);
          this.updateStats();
          return;
        }

        const session = this.callManager.getSessionByUser(userId);
        if (session) {
          console.log(`📋 Ending session: ${session.id}`);
          this.callManager.endSession(session.id);
          
          // Notify partner
          const partner = this.userManager.getUser(user.partnerId);
          if (partner) {
            console.log(`📢 Notifying partner ${partner.id} about call end`);
            this.io.to(partner.socketId).emit('call:ended', session.id);
            this.userManager.updateUser(partner.id, { isInCall: false, partnerId: undefined });
          } else {
            console.error(`❌ Partner not found: ${user.partnerId}`);
          }
        } else {
          console.error(`❌ Session not found for user: ${userId}`);
        }

        // Update user state
        this.userManager.updateUser(userId, { isInCall: false, partnerId: undefined });
        this.updateStats();
        
        console.log(`✅ Call ended successfully: ${userId}`);
      });

      // Handle WebRTC signaling
      socket.on('webrtc:offer', (offer) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC offer from ${userId} to ${offer.to}:`, {
          type: offer.type,
          from: offer.from,
          to: offer.to,
          sdpLength: offer.sdp?.length || 0
        });
        
        const partner = this.userManager.getUser(offer.to);
        if (partner) {
          console.log(`📤 Forwarding offer to partner ${partner.id} (${partner.socketId})`);
          this.io.to(partner.socketId).emit('webrtc:offer', offer);
        } else {
          console.error(`❌ Partner not found for offer: ${offer.to}`);
        }
      });

      socket.on('webrtc:answer', (answer) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC answer from ${userId} to ${answer.to}:`, {
          type: answer.type,
          from: answer.from,
          to: answer.to,
          sdpLength: answer.sdp?.length || 0
        });
        
        const partner = this.userManager.getUser(answer.to);
        if (partner) {
          console.log(`📤 Forwarding answer to partner ${partner.id} (${partner.socketId})`);
          this.io.to(partner.socketId).emit('webrtc:answer', answer);
        } else {
          console.error(`❌ Partner not found for answer: ${answer.to}`);
        }
      });

      socket.on('webrtc:ice-candidate', (candidate) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC ICE candidate from ${userId} to ${candidate.to}:`, {
          type: candidate.type,
          from: candidate.from,
          to: candidate.to,
          candidateType: candidate.candidate?.type || 'unknown'
        });
        
        const partner = this.userManager.getUser(candidate.to);
        if (partner) {
          console.log(`📤 Forwarding ICE candidate to partner ${partner.id} (${partner.socketId})`);
          this.io.to(partner.socketId).emit('webrtc:ice-candidate', candidate);
        } else {
          console.error(`❌ Partner not found for ICE candidate: ${candidate.to}`);
        }
      });

      // Handle chat messages
      socket.on('chat:message', (data: { sessionId: string; content: string }) => {
        const userId = socket.data.userId;
        console.log(`💬 Chat message from ${userId} in session ${data.sessionId}:`, {
          contentLength: data.content.length,
          content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '')
        });
        
        if (!userId) {
          console.error(`❌ No userId found for chat message from socket ${socket.id}`);
          return;
        }

        const message = this.callManager.addMessage(data.sessionId, userId, data.content);
        if (message) {
          const partnerId = this.callManager.getPartnerId(data.sessionId, userId);
          if (partnerId) {
            const partner = this.userManager.getUser(partnerId);
            if (partner) {
              console.log(`📤 Forwarding chat message to partner ${partner.id}`);
              this.io.to(partner.socketId).emit('chat:message', message);
            } else {
              console.error(`❌ Partner not found for chat: ${partnerId}`);
            }
          } else {
            console.error(`❌ Partner ID not found for session: ${data.sessionId}`);
          }
          socket.emit('chat:message', message);
        } else {
          console.error(`❌ Failed to add message to session: ${data.sessionId}`);
        }
      });

      // Handle chat history request
      socket.on('chat:history', (sessionId: string) => {
        const userId = socket.data.userId;
        console.log(`📚 Chat history request from ${userId} for session ${sessionId}`);
        
        const messages = this.callManager.getSessionMessages(sessionId);
        console.log(`📤 Sending ${messages.length} messages to ${userId}`);
        socket.emit('chat:history', messages);
      });

      // Handle audio level updates
      socket.on('audio:level', (level: number) => {
        const userId = socket.data.userId;
        if (userId) {
          this.userManager.updateUser(userId, { audioLevel: level });
          // Log only occasionally to avoid spam
          if (Math.random() < 0.01) { // 1% chance to log
            console.log(`🎵 Audio level update from ${userId}: ${level.toFixed(2)}`);
          }
        }
      });

      // Handle mute toggle
      socket.on('audio:mute', (isMuted: boolean) => {
        const userId = socket.data.userId;
        console.log(`🔇 Mute toggle from ${userId}: ${isMuted}`);
        
        if (userId) {
          this.userManager.updateUser(userId, { isMuted });
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        const userId = socket.data.userId;
        console.log(`🔌 Disconnect: ${socket.id} (${userId}) - Reason: ${reason}`);
        
        if (userId) {
          const user = this.userManager.getUser(userId);
          if (user) {
            console.log(`👤 Processing disconnect for user: ${userId}`);
            
            // End any active call
            if (user.isInCall && user.partnerId) {
              console.log(`📞 Ending active call for disconnected user ${userId} with partner ${user.partnerId}`);
              
              const session = this.callManager.getSessionByUser(userId);
              if (session) {
                console.log(`📋 Ending session: ${session.id}`);
                this.callManager.endSession(session.id);
                
                const partner = this.userManager.getUser(user.partnerId);
                if (partner) {
                  console.log(`📢 Notifying partner ${partner.id} about disconnect`);
                  this.io.to(partner.socketId).emit('call:ended', session.id);
                  this.userManager.updateUser(partner.id, { isInCall: false, partnerId: undefined });
                } else {
                  console.error(`❌ Partner not found during disconnect: ${user.partnerId}`);
                }
              } else {
                console.error(`❌ Session not found for disconnected user: ${userId}`);
              }
            } else {
              console.log(`⏳ Removing ${userId} from waiting queue (no active call)`);
              this.userManager.removeFromQueue(userId);
            }

            // Remove user
            this.userManager.removeUser(userId);
            this.updateStats();
            
            console.log(`✅ User cleanup completed: ${userId}`);
          } else {
            console.error(`❌ User not found during disconnect: ${userId}`);
          }
        } else {
          console.log(`⚠️ Socket ${socket.id} disconnected without userId`);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        const userId = socket.data.userId;
        console.error(`❌ Socket error for ${userId} (${socket.id}):`, error);
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
    
    // Log stats occasionally
    if (Math.random() < 0.1) { // 10% chance to log
      console.log(`📊 Stats update: ${stats.onlineUsers} online, ${stats.activeCalls} active calls, ${stats.totalSessions} total sessions`);
    }
  }

  private startStatsUpdateInterval(): void {
    setInterval(() => {
      this.updateStats();
    }, 5000); // Update stats every 5 seconds
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const cleanedSessions = this.callManager.cleanupInactiveSessions();
      if (cleanedSessions > 0) {
        console.log(`🧹 Cleaned up ${cleanedSessions} inactive sessions`);
      }
    }, 60000); // Cleanup every minute
  }
}
