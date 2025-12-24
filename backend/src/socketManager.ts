import { Server, Socket } from 'socket.io';
import { UserManager } from './userManager';
import { CallManager } from './callManager';
import { StatsManager } from './statsManager';
import { GameManager } from './gameManager';
import { User, UserFilters, WebRTCMessage, ChatMessage, HangmanSetWordData, HangmanGuessData } from './types';

export class SocketManager {
  constructor(
    private io: Server,
    private userManager: UserManager,
    private callManager: CallManager,
    private statsManager: StatsManager,
    private gameManager: GameManager
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
          // Auto-detect country from IP if not provided
          let detectedCountry = data.country;
          if (!detectedCountry) {
            // Get IP from multiple sources, handling arrays and undefined
            let clientIP: string | undefined;
            if (socket.handshake.address) {
              clientIP = socket.handshake.address;
            } else if (socket.request.headers['x-forwarded-for']) {
              const forwardedFor = socket.request.headers['x-forwarded-for'];
              clientIP = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
            } else if (socket.request.socket.remoteAddress) {
              clientIP = socket.request.socket.remoteAddress;
            }
            
            if (clientIP) {
              console.log(`🌍 Detecting country for IP: ${clientIP}`);
              detectedCountry = await this.userManager.getCountryByIP(clientIP) || undefined;
              if (detectedCountry) {
                console.log(`✅ Detected country: ${detectedCountry} for IP: ${clientIP}`);
              } else {
                console.log(`⚠️ Could not detect country for IP: ${clientIP} - this may be a local/private IP`);
              }
            }
          }
          
          const user = this.userManager.createUser(socket.id, data.age, detectedCountry);
          socket.data.userId = user.id;
          
          socket.emit('user:connect', user);
          this.updateStats();
          
          console.log(`✅ User connected successfully: ${user.id} (Age: ${user.age}, Country: ${user.country || 'Not detected'})`);
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
          
          // Record the match to prevent same users from matching again
          this.userManager.recordMatch(userId, partner.id);
          
          // Remove both users from queue
          this.userManager.removeFromQueue(userId);
          this.userManager.removeFromQueue(partner.id);

          // Create call session
          const session = this.callManager.createSession(userId, partner.id);
          console.log(`📋 Created session: ${session.id} for ${userId} ↔ ${partner.id}`);
          
          // Update user states
          this.userManager.updateUser(userId, { isInCall: true, partnerId: partner.id });
          this.userManager.updateUser(partner.id, { isInCall: true, partnerId: userId });

          // Deterministically choose an initiator so only one side creates the offer
          const initiatorId = user.id < partner.id ? user.id : partner.id;
          
          // Log partner info for debugging
          console.log(`📤 Sending call:matched to ${user.id}: partner=${partner.id}, country=${partner.country || 'undefined'}`);
          console.log(`📤 Sending call:matched to ${partner.id}: partner=${user.id}, country=${user.country || 'undefined'}`);
          
          // Notify both users with initiator information
          socket.emit('call:matched', partner, session.id, initiatorId);
          this.io.to(partner.socketId).emit('call:matched', user, session.id, initiatorId);

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
          
          // Clean up any active games for this session
          this.gameManager.cleanupSession(session.id);
          
          this.callManager.endSession(session.id);
          
          // Notify both users about call end
          socket.emit('call:ended', session.id); // Notify the user who initiated the hang up
          
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
          // Even if no session, still notify the user to clear their state
          socket.emit('call:ended', '');
        }

        // Update user state
        this.userManager.updateUser(userId, { isInCall: false, partnerId: undefined });
        this.updateStats();
        
        console.log(`✅ Call ended successfully: ${userId}`);
      });

      // Handle WebRTC signaling
      socket.on('webrtc:offer', (offer: WebRTCMessage & { to: string; from: string; sdp?: any }) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC offer from ${userId} to ${offer.to}:`, {
          type: offer.type,
          from: offer.from,
          to: offer.to,
          sdpLength: offer.sdp?.length || 0,
          sdpType: offer.sdp?.type,
          sdpPreview: offer.sdp?.sdp?.substring(0, 100) + '...',
          fullSdp: offer.sdp
        });
        
        const partner = this.userManager.getUser(offer.to);
        if (partner) {
          console.log(`📤 Forwarding offer to partner ${partner.id} (${partner.socketId})`);
          this.io.to(partner.socketId).emit('webrtc:offer', offer);
        } else {
          console.error(`❌ Partner not found for offer: ${offer.to}`);
        }
      });

      socket.on('webrtc:answer', (answer: WebRTCMessage & { to: string; from: string; sdp?: any }) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC answer from ${userId} to ${answer.to}:`, {
          type: answer.type,
          from: answer.from,
          to: answer.to,
          sdpLength: answer.sdp?.length || 0,
          sdpType: answer.sdp?.type,
          sdpPreview: answer.sdp?.sdp?.substring(0, 100) + '...',
          fullSdp: answer.sdp
        });
        
        const partner = this.userManager.getUser(answer.to);
        if (partner) {
          console.log(`📤 Forwarding answer to partner ${partner.id} (${partner.socketId})`);
          this.io.to(partner.socketId).emit('webrtc:answer', answer);
        } else {
          console.error(`❌ Partner not found for answer: ${answer.to}`);
        }
      });

      socket.on('webrtc:ice-candidate', (candidate: WebRTCMessage & { to: string; from: string; candidate?: any }) => {
        const userId = socket.data.userId;
        console.log(`📡 WebRTC ICE candidate from ${userId} to ${candidate.to}:`, {
          type: candidate.type,
          from: candidate.from,
          to: candidate.to,
          candidateType: candidate.candidate?.type || 'unknown',
          candidateData: candidate.candidate,
          candidatePreview: candidate.candidate?.candidate?.substring(0, 100) + '...'
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

      // ==================== GAME EVENTS ====================

      // Handle game invite
      socket.on('game:invite', (data: { sessionId: string; gameType: 'hangman' }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Game invite from ${userId} for session ${data.sessionId}`);
        
        if (!userId) {
          console.error(`❌ No userId found for game invite from socket ${socket.id}`);
          return;
        }

        const user = this.userManager.getUser(userId);
        if (!user || !user.partnerId) {
          console.error(`❌ User ${userId} has no partner for game invite`);
          socket.emit('game:error', 'No partner to invite');
          return;
        }

        // Check if there's already an active game or invite
        const existingGame = this.gameManager.getGameBySession(data.sessionId);
        if (existingGame) {
          console.log(`⚠️ Game already exists for session ${data.sessionId}`);
          socket.emit('game:error', 'A game is already in progress');
          return;
        }

        const existingInvite = this.gameManager.getInviteBySession(data.sessionId);
        if (existingInvite) {
          console.log(`⚠️ Invite already pending for session ${data.sessionId}`);
          socket.emit('game:error', 'An invite is already pending');
          return;
        }

        // Create invite
        const inviteId = this.gameManager.createInvite(userId, user.partnerId, data.sessionId);
        console.log(`📨 Created game invite ${inviteId}`);

        // Notify partner
        const partner = this.userManager.getUser(user.partnerId);
        if (partner) {
          this.io.to(partner.socketId).emit('game:invited', {
            inviteId,
            fromUserId: userId,
            sessionId: data.sessionId,
            gameType: data.gameType
          });
          socket.emit('game:invite-sent', { inviteId });
        }
      });

      // Handle game accept
      socket.on('game:accept', (data: { inviteId: string }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Game accept from ${userId} for invite ${data.inviteId}`);
        
        if (!userId) {
          console.error(`❌ No userId found for game accept from socket ${socket.id}`);
          return;
        }

        const invite = this.gameManager.getInvite(data.inviteId);
        if (!invite) {
          console.error(`❌ Invite ${data.inviteId} not found`);
          socket.emit('game:error', 'Invite not found or expired');
          return;
        }

        if (invite.toUserId !== userId) {
          console.error(`❌ User ${userId} is not the invite recipient`);
          socket.emit('game:error', 'Invalid invite');
          return;
        }

        // Remove the invite
        this.gameManager.removeInvite(data.inviteId);

        // Randomly assign roles
        const isInviterSetter = Math.random() < 0.5;
        const setterId = isInviterSetter ? invite.fromUserId : invite.toUserId;
        const guesserId = isInviterSetter ? invite.toUserId : invite.fromUserId;

        // Create the game
        const game = this.gameManager.createGame(invite.sessionId, setterId, guesserId);
        console.log(`🎮 Created game ${game.id} - Setter: ${setterId}, Guesser: ${guesserId}`);

        // Notify both players
        const inviter = this.userManager.getUser(invite.fromUserId);
        const accepter = this.userManager.getUser(invite.toUserId);

        if (inviter) {
          const inviterRole = setterId === inviter.id ? 'setter' : 'guesser';
          this.io.to(inviter.socketId).emit('game:started', {
            game: this.gameManager.getPublicGameState(game, inviter.id),
            role: inviterRole
          });
        }

        if (accepter) {
          const accepterRole = setterId === accepter.id ? 'setter' : 'guesser';
          this.io.to(accepter.socketId).emit('game:started', {
            game: this.gameManager.getPublicGameState(game, accepter.id),
            role: accepterRole
          });
        }
      });

      // Handle game decline
      socket.on('game:decline', (data: { inviteId: string }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Game decline from ${userId} for invite ${data.inviteId}`);
        
        const invite = this.gameManager.getInvite(data.inviteId);
        if (!invite) return;

        this.gameManager.removeInvite(data.inviteId);

        // Notify the inviter
        const inviter = this.userManager.getUser(invite.fromUserId);
        if (inviter) {
          this.io.to(inviter.socketId).emit('game:declined', { inviteId: data.inviteId });
        }
      });

      // Handle set word (from setter)
      socket.on('game:set-word', (data: HangmanSetWordData) => {
        const userId = socket.data.userId;
        console.log(`🎮 Set word from ${userId} for game ${data.gameId}`);
        
        if (!userId) {
          console.error(`❌ No userId found for set-word from socket ${socket.id}`);
          return;
        }

        const game = this.gameManager.getGame(data.gameId);
        if (!game) {
          socket.emit('game:error', 'Game not found');
          return;
        }

        if (game.setterId !== userId) {
          socket.emit('game:error', 'Only the word setter can set the word');
          return;
        }

        const updatedGame = this.gameManager.setWord(data.gameId, data.word, data.category);
        if (!updatedGame) {
          socket.emit('game:error', 'Invalid word. Use 3-15 letters only.');
          return;
        }

        console.log(`✅ Word set for game ${data.gameId}: ${updatedGame.word.length} letters`);

        // Notify both players
        const setter = this.userManager.getUser(game.setterId);
        const guesser = this.userManager.getUser(game.guesserId);

        if (setter) {
          this.io.to(setter.socketId).emit('game:word-set', {
            game: this.gameManager.getPublicGameState(updatedGame, setter.id)
          });
        }

        if (guesser) {
          this.io.to(guesser.socketId).emit('game:word-set', {
            game: this.gameManager.getPublicGameState(updatedGame, guesser.id)
          });
        }
      });

      // Handle guess (letter or full word)
      socket.on('game:guess', (data: HangmanGuessData) => {
        const userId = socket.data.userId;
        console.log(`🎮 Guess from ${userId} for game ${data.gameId}: "${data.guess}" (full word: ${data.isFullWordGuess})`);
        
        if (!userId) {
          console.error(`❌ No userId found for guess from socket ${socket.id}`);
          return;
        }

        const game = this.gameManager.getGame(data.gameId);
        if (!game) {
          socket.emit('game:error', 'Game not found');
          return;
        }

        if (game.guesserId !== userId) {
          socket.emit('game:error', 'Only the guesser can make guesses');
          return;
        }

        if (game.state !== 'guessing') {
          socket.emit('game:error', 'Game is not in guessing phase');
          return;
        }

        // Process the guess
        const result = data.isFullWordGuess
          ? this.gameManager.guessWord(data.gameId, data.guess)
          : this.gameManager.guessLetter(data.gameId, data.guess);

        if (!result) {
          socket.emit('game:error', 'Invalid guess');
          return;
        }

        console.log(`🎯 Guess result: ${result.isCorrect ? 'CORRECT' : 'WRONG'}, Attempts left: ${result.attemptsLeft}`);

        // Notify both players
        const setter = this.userManager.getUser(game.setterId);
        const guesser = this.userManager.getUser(game.guesserId);

        if (setter) {
          this.io.to(setter.socketId).emit('game:guess-result', result);
        }

        if (guesser) {
          this.io.to(guesser.socketId).emit('game:guess-result', result);
        }

        // If game ended, send game-ended event
        if (result.isGameOver) {
          const endedGame = this.gameManager.getGame(data.gameId);
          if (endedGame) {
            if (setter) {
              this.io.to(setter.socketId).emit('game:ended', {
                game: this.gameManager.getPublicGameState(endedGame, setter.id),
                winner: result.winner,
                word: result.revealedWord
              });
            }
            if (guesser) {
              this.io.to(guesser.socketId).emit('game:ended', {
                game: this.gameManager.getPublicGameState(endedGame, guesser.id),
                winner: result.winner,
                word: result.revealedWord
              });
            }
          }
        }
      });

      // Handle game end (early quit)
      socket.on('game:end', (data: { gameId: string }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Game end request from ${userId} for game ${data.gameId}`);
        
        const game = this.gameManager.getGame(data.gameId);
        if (!game) return;

        const endedGame = this.gameManager.endGame(data.gameId);
        if (!endedGame) return;

        // Notify both players
        const setter = this.userManager.getUser(game.setterId);
        const guesser = this.userManager.getUser(game.guesserId);

        if (setter) {
          this.io.to(setter.socketId).emit('game:ended', {
            game: this.gameManager.getPublicGameState(endedGame, setter.id),
            winner: undefined,
            word: endedGame.word,
            reason: 'quit'
          });
        }

        if (guesser) {
          this.io.to(guesser.socketId).emit('game:ended', {
            game: this.gameManager.getPublicGameState(endedGame, guesser.id),
            winner: undefined,
            word: endedGame.word,
            reason: 'quit'
          });
        }
      });

      // Handle rematch request
      socket.on('game:rematch', (data: { sessionId: string }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Rematch request from ${userId} for session ${data.sessionId}`);
        
        if (!userId) return;

        const user = this.userManager.getUser(userId);
        if (!user || !user.partnerId) {
          socket.emit('game:error', 'No partner for rematch');
          return;
        }

        // Get the previous game to swap roles
        const prevGame = this.gameManager.getGameBySession(data.sessionId);
        
        // Create invite with swapped roles hint
        const inviteId = this.gameManager.createInvite(userId, user.partnerId, data.sessionId);

        const partner = this.userManager.getUser(user.partnerId);
        if (partner) {
          this.io.to(partner.socketId).emit('game:rematch-invited', {
            inviteId,
            fromUserId: userId,
            sessionId: data.sessionId,
            prevSetterId: prevGame?.setterId
          });
          socket.emit('game:invite-sent', { inviteId, isRematch: true });
        }
      });

      // Handle rematch accept
      socket.on('game:rematch-accept', (data: { inviteId: string; prevSetterId?: string }) => {
        const userId = socket.data.userId;
        console.log(`🎮 Rematch accept from ${userId}`);
        
        if (!userId) return;

        const invite = this.gameManager.getInvite(data.inviteId);
        if (!invite || invite.toUserId !== userId) {
          socket.emit('game:error', 'Invalid rematch invite');
          return;
        }

        this.gameManager.removeInvite(data.inviteId);

        // Swap roles from previous game
        const setterId = data.prevSetterId === invite.fromUserId ? invite.toUserId : invite.fromUserId;
        const guesserId = data.prevSetterId === invite.fromUserId ? invite.fromUserId : invite.toUserId;

        const game = this.gameManager.createGame(invite.sessionId, setterId, guesserId);
        console.log(`🎮 Rematch game ${game.id} - Setter: ${setterId}, Guesser: ${guesserId}`);

        const inviter = this.userManager.getUser(invite.fromUserId);
        const accepter = this.userManager.getUser(invite.toUserId);

        if (inviter) {
          this.io.to(inviter.socketId).emit('game:started', {
            game: this.gameManager.getPublicGameState(game, inviter.id),
            role: setterId === inviter.id ? 'setter' : 'guesser'
          });
        }

        if (accepter) {
          this.io.to(accepter.socketId).emit('game:started', {
            game: this.gameManager.getPublicGameState(game, accepter.id),
            role: setterId === accepter.id ? 'setter' : 'guesser'
          });
        }
      });

      // ==================== END GAME EVENTS ====================

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
                
                // Clean up any active games for this session
                this.gameManager.cleanupSession(session.id);
                
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
      const cleanedGames = this.gameManager.cleanupOldGames();
      if (cleanedSessions > 0) {
        console.log(`🧹 Cleaned up ${cleanedSessions} inactive sessions`);
      }
      if (cleanedGames > 0) {
        console.log(`🧹 Cleaned up ${cleanedGames} old games`);
      }
    }, 60000); // Cleanup every minute
  }
}
