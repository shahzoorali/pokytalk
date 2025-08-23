import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User, UserFilters } from '@pokytalk/shared';

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
      // Remove IPv6 prefix if present
      const cleanIP = ip.replace(/^::ffff:/, '');
      
      // Skip localhost and private IPs
      if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || 
          cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || 
          cleanIP.startsWith('172.')) {
        return null;
      }

      const response = await axios.get(`http://ip-api.com/json/${cleanIP}?fields=countryCode`);
      return response.data.countryCode || null;
    } catch (error) {
      console.error('Error getting country by IP:', error);
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
