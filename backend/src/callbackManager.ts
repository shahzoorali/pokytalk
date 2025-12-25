import { v4 as uuidv4 } from 'uuid';
import { CallbackRequest } from './types';

export class CallbackManager {
  private requests: Map<string, CallbackRequest> = new Map(); // requestId -> CallbackRequest
  private userRequests: Map<string, Set<string>> = new Map(); // userId -> Set of requestIds (requests they sent)
  private userReceivedRequests: Map<string, Set<string>> = new Map(); // userId -> Set of requestIds (requests they received)
  private readonly REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a callback request
   */
  createRequest(
    fromUserId: string,
    toUserId: string,
    originalCallTimestamp?: Date,
    originalCallCountry?: string
  ): CallbackRequest {
    const requestId = uuidv4();
    const request: CallbackRequest = {
      id: requestId,
      fromUserId,
      toUserId,
      timestamp: new Date(),
      status: 'pending',
      originalCallTimestamp,
      originalCallCountry,
    };

    this.requests.set(requestId, request);

    // Track request by user
    if (!this.userRequests.has(fromUserId)) {
      this.userRequests.set(fromUserId, new Set());
    }
    this.userRequests.get(fromUserId)!.add(requestId);

    if (!this.userReceivedRequests.has(toUserId)) {
      this.userReceivedRequests.set(toUserId, new Set());
    }
    this.userReceivedRequests.get(toUserId)!.add(requestId);

    // Set timeout to expire request after 5 minutes
    setTimeout(() => {
      const req = this.requests.get(requestId);
      if (req && req.status === 'pending') {
        req.status = 'expired';
        this.requests.set(requestId, req);
        // Clean up expired request after a delay
        setTimeout(() => {
          this.removeRequest(requestId);
        }, 60000); // Keep expired requests for 1 minute for reference
      }
    }, this.REQUEST_TIMEOUT_MS);

    return request;
  }

  /**
   * Get a callback request by ID
   */
  getRequest(requestId: string): CallbackRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get pending requests sent by a user
   */
  getPendingRequestsSent(userId: string): CallbackRequest[] {
    const requestIds = this.userRequests.get(userId) || new Set();
    return Array.from(requestIds)
      .map(id => this.requests.get(id))
      .filter((req): req is CallbackRequest => req !== undefined && req.status === 'pending');
  }

  /**
   * Get pending requests received by a user
   */
  getPendingRequestsReceived(userId: string): CallbackRequest[] {
    const requestIds = this.userReceivedRequests.get(userId) || new Set();
    return Array.from(requestIds)
      .map(id => this.requests.get(id))
      .filter((req): req is CallbackRequest => req !== undefined && req.status === 'pending');
  }

  /**
   * Check for mutual callback (both users requesting callback to each other)
   */
  checkMutualCallback(user1Id: string, user2Id: string): CallbackRequest | null {
    // Check if user1 has pending request to user2
    const user1Requests = this.getPendingRequestsSent(user1Id);
    const user1ToUser2 = user1Requests.find(req => req.toUserId === user2Id);

    // Check if user2 has pending request to user1
    const user2Requests = this.getPendingRequestsSent(user2Id);
    const user2ToUser1 = user2Requests.find(req => req.toUserId === user1Id);

    // If both exist, return the first one (we'll use it for matching)
    if (user1ToUser2 && user2ToUser1) {
      return user1ToUser2;
    }

    return null;
  }

  /**
   * Accept a callback request
   */
  acceptRequest(requestId: string): CallbackRequest | undefined {
    const request = this.requests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'accepted';
      this.requests.set(requestId, request);
      return request;
    }
    return undefined;
  }

  /**
   * Decline a callback request
   */
  declineRequest(requestId: string): CallbackRequest | undefined {
    const request = this.requests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'declined';
      this.requests.set(requestId, request);
      // Clean up declined request after a delay
      setTimeout(() => {
        this.removeRequest(requestId);
      }, 60000); // Keep for 1 minute
      return request;
    }
    return undefined;
  }

  /**
   * Cancel a callback request (by requester)
   */
  cancelRequest(requestId: string): CallbackRequest | undefined {
    const request = this.requests.get(requestId);
    if (request && request.status === 'pending') {
      this.removeRequest(requestId);
      return request;
    }
    return undefined;
  }

  /**
   * Remove a callback request
   */
  private removeRequest(requestId: string): void {
    const request = this.requests.get(requestId);
    if (!request) return;

    // Remove from user tracking
    const fromRequests = this.userRequests.get(request.fromUserId);
    if (fromRequests) {
      fromRequests.delete(requestId);
      if (fromRequests.size === 0) {
        this.userRequests.delete(request.fromUserId);
      }
    }

    const toReceivedRequests = this.userReceivedRequests.get(request.toUserId);
    if (toReceivedRequests) {
      toReceivedRequests.delete(requestId);
      if (toReceivedRequests.size === 0) {
        this.userReceivedRequests.delete(request.toUserId);
      }
    }

    this.requests.delete(requestId);
  }

  /**
   * Get all requests for a user (sent and received)
   */
  getAllUserRequests(userId: string): CallbackRequest[] {
    const sentIds = this.userRequests.get(userId) || new Set();
    const receivedIds = this.userReceivedRequests.get(userId) || new Set();
    const allIds = new Set([...sentIds, ...receivedIds]);
    
    return Array.from(allIds)
      .map(id => this.requests.get(id))
      .filter((req): req is CallbackRequest => req !== undefined);
  }

  /**
   * Clean up expired requests
   */
  cleanupExpiredRequests(): number {
    let cleaned = 0;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [requestId, request] of this.requests.entries()) {
      if (
        (request.status === 'expired' || request.status === 'declined') &&
        request.timestamp < oneHourAgo
      ) {
        this.removeRequest(requestId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

