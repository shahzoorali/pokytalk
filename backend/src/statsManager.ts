import { ServerStats } from '@pokytalk/shared';

export class StatsManager {
  private stats: ServerStats = {
    onlineUsers: 0,
    activeCalls: 0,
    totalSessions: 0
  };

  private totalSessionsCreated = 0;

  updateOnlineUsers(count: number): void {
    this.stats.onlineUsers = count;
  }

  updateActiveCalls(count: number): void {
    this.stats.activeCalls = count;
  }

  incrementTotalSessions(): void {
    this.totalSessionsCreated++;
    this.stats.totalSessions = this.totalSessionsCreated;
  }

  getStats(): ServerStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      onlineUsers: 0,
      activeCalls: 0,
      totalSessions: this.totalSessionsCreated
    };
  }
}
