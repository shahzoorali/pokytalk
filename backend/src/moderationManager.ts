import { v4 as uuidv4 } from 'uuid';
import { UserReport, BlockedUser, ReportReason } from './types';

export class ModerationManager {
  private reports: Map<string, UserReport> = new Map();
  private blocks: Map<string, Set<string>> = new Map(); // blockerId -> Set of blocked user IDs
  private userReportCounts: Map<string, number> = new Map(); // userId -> report count
  private readonly AUTO_BAN_THRESHOLD = 5; // Auto-ban after 5 reports
  private readonly SUSPICIOUS_KEYWORDS = [
    'send money', 'wire transfer', 'bitcoin', 'crypto', 'gift card',
    'bank account', 'credit card', 'social security', 'ssn',
    'meet me', 'come over', 'my address', 'where do you live',
    'send nudes', 'show me', 'video call', 'private chat'
  ];

  /**
   * Report a user
   */
  reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
    sessionId?: string
  ): UserReport {
    const report: UserReport = {
      id: uuidv4(),
      reporterId,
      reportedUserId,
      reason,
      description,
      sessionId,
      timestamp: new Date(),
      reviewed: false,
    };

    this.reports.set(report.id, report);

    // Increment report count for reported user
    const currentCount = this.userReportCounts.get(reportedUserId) || 0;
    this.userReportCounts.set(reportedUserId, currentCount + 1);

    // Log for moderation review
    console.log(`🚨 User Report: ${reportedUserId} reported by ${reporterId}`, {
      reason,
      description,
      totalReports: currentCount + 1,
    });

    // Auto-ban if threshold reached
    if (currentCount + 1 >= this.AUTO_BAN_THRESHOLD) {
      console.log(`⚠️ User ${reportedUserId} has reached ${this.AUTO_BAN_THRESHOLD} reports - auto-ban recommended`);
      report.actionTaken = 'ban';
    }

    return report;
  }

  /**
   * Block a user
   */
  blockUser(blockerId: string, blockedUserId: string): void {
    if (!this.blocks.has(blockerId)) {
      this.blocks.set(blockerId, new Set());
    }
    this.blocks.get(blockerId)!.add(blockedUserId);

    console.log(`🚫 User ${blockerId} blocked ${blockedUserId}`);
  }

  /**
   * Unblock a user
   */
  unblockUser(blockerId: string, blockedUserId: string): void {
    const blockedSet = this.blocks.get(blockerId);
    if (blockedSet) {
      blockedSet.delete(blockedUserId);
      if (blockedSet.size === 0) {
        this.blocks.delete(blockerId);
      }
      console.log(`✅ User ${blockerId} unblocked ${blockedUserId}`);
    }
  }

  /**
   * Check if a user is blocked by another user
   */
  isBlocked(blockerId: string, blockedUserId: string): boolean {
    const blockedSet = this.blocks.get(blockerId);
    return blockedSet ? blockedSet.has(blockedUserId) : false;
  }

  /**
   * Get all users blocked by a specific user
   */
  getBlockedUsers(userId: string): string[] {
    const blockedSet = this.blocks.get(userId);
    return blockedSet ? Array.from(blockedSet) : [];
  }

  /**
   * Detect suspicious behavior in chat messages
   */
  detectSuspiciousBehavior(message: string): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const lowerMessage = message.toLowerCase();
    const reasons: string[] = [];

    // Check for suspicious keywords
    for (const keyword of this.SUSPICIOUS_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        reasons.push(`Contains suspicious keyword: "${keyword}"`);
      }
    }

    // Check for excessive personal information requests
    const personalInfoPatterns = [
      /\b(phone|number|cell|mobile)\b/gi,
      /\b(email|address|location|where)\b/gi,
      /\b(social|security|ssn|bank|account)\b/gi,
    ];

    let personalInfoCount = 0;
    for (const pattern of personalInfoPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        personalInfoCount += matches.length;
      }
    }

    if (personalInfoCount >= 3) {
      reasons.push('Multiple requests for personal information');
    }

    // Check for spam patterns (repeated characters/words)
    const spamPattern = /(.)\1{4,}/; // Same character repeated 5+ times
    if (spamPattern.test(message)) {
      reasons.push('Spam pattern detected');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Get report count for a user
   */
  getReportCount(userId: string): number {
    return this.userReportCounts.get(userId) || 0;
  }

  /**
   * Get all reports for a user
   */
  getUserReports(userId: string): UserReport[] {
    return Array.from(this.reports.values()).filter(
      report => report.reportedUserId === userId
    );
  }

  /**
   * Get all reports (for moderation dashboard)
   */
  getAllReports(): UserReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Mark a report as reviewed
   */
  markReportReviewed(reportId: string, actionTaken?: 'warning' | 'suspension' | 'ban' | 'none'): void {
    const report = this.reports.get(reportId);
    if (report) {
      report.reviewed = true;
      if (actionTaken) {
        report.actionTaken = actionTaken;
      }
    }
  }

  /**
   * Clean up old reports (older than 90 days)
   */
  cleanupOldReports(): number {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let cleaned = 0;
    for (const [reportId, report] of this.reports.entries()) {
      if (report.timestamp < ninetyDaysAgo && report.reviewed) {
        this.reports.delete(reportId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

