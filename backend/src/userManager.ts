import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User, UserFilters } from './types';

export class UserManager {
  private users: Map<string, User> = new Map();
  private waitingQueue: string[] = [];

  createUser(socketId: string, age?: number, country?: string): User {
    const user: User = {
      id: uuidv4(),
      socketId,
      age,
      country,
      isConnected: true,
      isInCall: false,
      audioLevel: 0,
      isMuted: false,
      joinedAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserBySocketId(socketId: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.socketId === socketId) {
        return user;
      }
    }
    return undefined;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  removeUser(userId: string): User | undefined {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.removeFromQueue(userId);
    }
    return user;
  }

  addToQueue(userId: string): void {
    if (!this.waitingQueue.includes(userId)) {
      this.waitingQueue.push(userId);
    }
  }

  removeFromQueue(userId: string): void {
    const index = this.waitingQueue.indexOf(userId);
    if (index > -1) {
      this.waitingQueue.splice(index, 1);
    }
  }

  getWaitingUsers(filters?: UserFilters): string[] {
    let filteredUsers = this.waitingQueue.filter(userId => {
      const user = this.users.get(userId);
      if (!user || user.isInCall) return false;

      if (filters) {
        if (filters.minAge && user.age && user.age < filters.minAge) return false;
        if (filters.maxAge && user.age && user.age > filters.maxAge) return false;
        if (filters.countries && user.country && !filters.countries.includes(user.country)) return false;
      }

      return true;
    });

    // Shuffle the queue for random matching
    return this.shuffleArray(filteredUsers);
  }

  getRandomPartner(userId: string, filters?: UserFilters): User | undefined {
    const availableUsers = this.getWaitingUsers(filters).filter(id => id !== userId);
    if (availableUsers.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const partnerId = availableUsers[randomIndex];
    return this.users.get(partnerId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getConnectedUsers(): User[] {
    return this.getAllUsers().filter(user => user.isConnected);
  }

  async getCountryByIP(ip: string): Promise<string | null> {
    try {
      // Handle array of IPs (from x-forwarded-for header)
      let cleanIP = Array.isArray(ip) ? ip[0] : ip;
      
      // Remove IPv6 prefix if present
      cleanIP = cleanIP.replace(/^::ffff:/, '');
      
      // Skip localhost and private IPs
      if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || 
          cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || 
          cleanIP.startsWith('172.16.') || cleanIP.startsWith('172.17.') ||
          cleanIP.startsWith('172.18.') || cleanIP.startsWith('172.19.') ||
          cleanIP.startsWith('172.20.') || cleanIP.startsWith('172.21.') ||
          cleanIP.startsWith('172.22.') || cleanIP.startsWith('172.23.') ||
          cleanIP.startsWith('172.24.') || cleanIP.startsWith('172.25.') ||
          cleanIP.startsWith('172.26.') || cleanIP.startsWith('172.27.') ||
          cleanIP.startsWith('172.28.') || cleanIP.startsWith('172.29.') ||
          cleanIP.startsWith('172.30.') || cleanIP.startsWith('172.31.')) {
        console.log(`⚠️ Skipping country detection for private/local IP: ${cleanIP}`);
        return null;
      }

      console.log(`🌐 Fetching country for IP: ${cleanIP}`);
      const response = await axios.get(`http://ip-api.com/json/${cleanIP}?fields=countryCode`, {
        timeout: 5000
      });
      
      const countryCode = response.data?.countryCode || null;
      if (countryCode) {
        console.log(`✅ Country detected: ${countryCode} for IP: ${cleanIP}`);
      } else {
        console.log(`⚠️ No country code in response for IP: ${cleanIP}`, response.data);
      }
      
      return countryCode;
    } catch (error: any) {
      console.error(`❌ Error getting country by IP ${ip}:`, error.message || error);
      return null;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
