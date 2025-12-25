# Callback Feature Code Audit Report

## Executive Summary

The callback feature implementation is **functionally complete** but has several **critical issues** that need to be addressed for production readiness. The main concerns are memory leaks, race conditions, missing validations, and incomplete error handling.

## Critical Issues

### 1. ⚠️ **Memory Leak: Unmanaged setTimeout Timers in CallbackManager**

**Location:** `backend/src/callbackManager.ts:44-54`

**Issue:** Each `createRequest` creates a `setTimeout` that isn't tracked. If the request is accepted/declined/cancelled before timeout, the timer still runs. With many requests, timers accumulate.

**Impact:** Memory leak, potential performance degradation

**Fix Required:**
```typescript
private requestTimeouts: Map<string, NodeJS.Timeout> = new Map();

createRequest(...) {
  // ... existing code ...
  
  const timeoutId = setTimeout(() => {
    // ... existing timeout logic ...
    this.requestTimeouts.delete(requestId);
  }, this.REQUEST_TIMEOUT_MS);
  
  this.requestTimeouts.set(requestId, timeoutId);
  
  return request;
}

private removeRequest(requestId: string): void {
  // Clear timeout if exists
  const timeout = this.requestTimeouts.get(requestId);
  if (timeout) {
    clearTimeout(timeout);
    this.requestTimeouts.delete(requestId);
  }
  // ... rest of cleanup ...
}
```

### 2. ⚠️ **Race Condition: Mutual Callback Detection**

**Location:** `backend/src/socketManager.ts:457-521`

**Issue:** When two users simultaneously request callbacks, both might create requests before mutual detection runs. The check happens AFTER creating the request, not atomically.

**Impact:** Both requests might be created, then one gets cancelled, but timing issues could cause problems.

**Current Flow:**
1. User A sends `callback:request` → Creates request A→B
2. User B sends `callback:request` → Creates request B→A
3. Check for mutual → Detects mutual → Cancels both

**Better Flow:**
1. User A sends `callback:request` → Check for existing B→A first
2. If exists → Auto-match immediately
3. If not → Create request A→B

**Fix Required:** Check for reverse request BEFORE creating new request.

### 3. ⚠️ **Missing Validation: originalCallTimestamp**

**Location:** `backend/src/socketManager.ts:434`

**Issue:** `originalCallTimestamp` from client isn't validated. Could be:
- Future date (invalid)
- Invalid date string
- Malformed data

**Impact:** Potential bugs, incorrect display in UI

**Fix Required:**
```typescript
const { toUserId, originalCallTimestamp, originalCallCountry } = data;

// Validate timestamp
let validatedTimestamp: Date | undefined;
if (originalCallTimestamp) {
  const date = new Date(originalCallTimestamp);
  const now = new Date();
  // Only accept past dates, within reasonable range (e.g., last year)
  if (!isNaN(date.getTime()) && date < now && date > new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)) {
    validatedTimestamp = date;
  }
}
```

### 4. ⚠️ **Memory Leak: Frontend setTimeout Not Cleared**

**Location:** `frontend/src/components/CallHistorySidebar.tsx:37`

**Issue:** `setTimeout` in `handleRequestCallback` isn't cleared if component unmounts.

**Impact:** Memory leak, potential state updates on unmounted component

**Fix Required:**
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleRequestCallback = async (entry: CallHistoryEntry) => {
  if (isRequesting) return
  
  setIsRequesting(entry.partnerId)
  try {
    onRequestCallback(entry.partnerId, entry.timestamp, entry.country)
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsRequesting(null), 1000)
  } catch (error) {
    console.error('Failed to request callback:', error)
    setIsRequesting(null)
  }
}

useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }
}, [])
```

### 5. ⚠️ **Missing Cleanup: Blocked Users' Pending Requests**

**Location:** `frontend/src/hooks/useSocket.ts:327-336`

**Issue:** When a user is blocked, any pending callback requests with that user aren't cancelled.

**Impact:** User might still receive callback notifications from blocked users

**Fix Required:** Cancel pending requests when user is blocked:
```typescript
newSocket.on('user:block:success', (data: { message: string; blockedUserId: string }) => {
  // ... existing code ...
  
  // Cancel any pending callback requests with blocked user
  // Need to track pending request IDs
  // Or emit event to backend to cancel requests
})
```

**Backend Fix:** Add handler to cancel requests when user blocks someone:
```typescript
socket.on('user:block', (data: { blockedUserId: string }) => {
  // Cancel all pending callback requests involving this user
  const allRequests = this.callbackManager.getAllUserRequests(userId);
  allRequests.forEach(req => {
    if (req.fromUserId === data.blockedUserId || req.toUserId === data.blockedUserId) {
      this.callbackManager.cancelRequest(req.id);
    }
  });
});
```

### 6. ⚠️ **Missing Re-validation: Block Status Check on Accept**

**Location:** `backend/src/socketManager.ts:556-649`

**Issue:** When accepting a callback request, block status isn't re-checked. Users might have blocked each other since the request was sent.

**Impact:** Blocked users could still connect via callback

**Fix Required:**
```typescript
socket.on('callback:accept', (requestId: string) => {
  // ... existing validation ...
  
  // Re-check block status
  if (this.moderationManager.isBlocked(userId, request.fromUserId) ||
      this.moderationManager.isBlocked(request.fromUserId, userId)) {
    socket.emit('callback:accept:error', { message: 'Cannot accept callback' });
    return;
  }
  
  // ... rest of accept logic ...
});
```

## Medium Priority Issues

### 7. **Type Inconsistency: Date vs String**

**Location:** `frontend/src/hooks/useSocket.ts:373-379`

**Issue:** `originalCallTimestamp` is sent as Date but socket events use strings. Conversion happens but could be more explicit.

**Current:** Works but implicit conversion
**Recommendation:** Add explicit type conversion comments

### 8. **Limited Request Handling: Only First Pending Request**

**Location:** `backend/src/socketManager.ts:1182`

**Issue:** `checkPendingCallbackRequests` only notifies about the first pending request. If user has multiple pending requests, others wait.

**Impact:** Users might wait longer than necessary

**Recommendation:** Consider notifying about all pending requests, or implement a queue system.

### 9. **Missing Error Event: Requester Goes Offline During Accept**

**Location:** `backend/src/socketManager.ts:584-588`

**Issue:** If requester goes offline between request and accept, error is emitted but target user isn't notified that requester is offline.

**Recommendation:** Notify target user when requester goes offline:
```typescript
if (!requester || !requester.isConnected) {
  socket.emit('callback:accept:error', { message: 'Requester is no longer online' });
  // Also notify requester if they reconnect later
  // Could emit event to requester's socket if they reconnect
  return;
}
```

### 10. **Double Cleanup in Mutual Callback**

**Location:** `backend/src/socketManager.ts:506-518`

**Issue:** Both requests are cancelled individually, but `cancelRequest` already removes them. The loop might try to cancel already-cancelled requests.

**Impact:** Minor - no functional issue but inefficient

**Fix:** The current implementation is actually fine - `cancelRequest` checks status before removing. No change needed.

## Low Priority / Code Quality Issues

### 11. **Missing Input Validation: Empty toUserId**

**Location:** `backend/src/socketManager.ts:434`

**Issue:** `toUserId` isn't validated for empty/null/undefined before use.

**Recommendation:** Add validation:
```typescript
if (!toUserId || typeof toUserId !== 'string' || toUserId.trim() === '') {
  socket.emit('callback:request:error', { message: 'Invalid user ID' });
  return;
}
```

### 12. **Missing Error Handling: localStorage Quota Exceeded**

**Location:** `frontend/src/hooks/useCallHistory.ts:30-36`

**Issue:** If localStorage quota is exceeded, error is logged but user isn't notified.

**Recommendation:** Add user notification or fallback:
```typescript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
} catch (error) {
  console.error('Error saving call history:', error)
  // Notify user or implement fallback storage
  if (error.name === 'QuotaExceededError') {
    // Remove oldest entries and retry
    const reduced = history.slice(0, MAX_ENTRIES - 1)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced))
      setHistory(reduced)
    } catch (retryError) {
      // Still failed - notify user
    }
  }
}
```

### 13. **Missing Cleanup: Expired Request Cleanup Interval**

**Location:** `backend/src/socketManager.ts` (missing)

**Issue:** `cleanupExpiredRequests` exists in CallbackManager but isn't called periodically.

**Current:** Cleanup happens in `startCallbackCleanupInterval` - need to verify it's called.

**Status:** ✅ Actually implemented - verified in code

### 14. **Potential Issue: Multiple Simultaneous Requests**

**Location:** `frontend/src/components/CallHistorySidebar.tsx:30-42`

**Issue:** User can click "Call Back" multiple times rapidly, creating multiple requests.

**Current:** `isRequesting` state prevents this, but only for 1 second.

**Recommendation:** Increase timeout or add debouncing:
```typescript
const [isRequesting, setIsRequesting] = useState<string | null>(null)
const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

const handleRequestCallback = async (entry: CallHistoryEntry) => {
  if (isRequesting || requestedIds.has(entry.partnerId)) return
  
  setIsRequesting(entry.partnerId)
  setRequestedIds(prev => new Set([...prev, entry.partnerId]))
  // ... rest of logic ...
}
```

## Security Considerations

### 15. ✅ **Authorization Checks: Properly Implemented**

All callback handlers properly check:
- User authentication (`socket.data.userId`)
- Request ownership (requester vs target)
- Block status
- User online status

### 16. ✅ **Silent Failures: Correctly Implemented**

Blocked users fail silently as per requirements - no information leak.

## Performance Considerations

### 17. **Potential N+1 Query Pattern**

**Location:** `backend/src/socketManager.ts:507-518`

**Issue:** In mutual callback cleanup, iterates through all requests for both users.

**Impact:** Minor - only affects cleanup, not critical path

**Status:** Acceptable for current scale

### 18. **localStorage Write Frequency**

**Location:** `frontend/src/hooks/useCallHistory.ts:30-36`

**Issue:** Writes to localStorage on every history change (including during load).

**Impact:** Minor - localStorage is fast, but could batch writes

**Status:** Acceptable for current implementation

## Testing Recommendations

### Missing Test Cases:
1. ✅ Race condition: Simultaneous mutual callback requests
2. ✅ Memory leak: Many requests created and cancelled
3. ✅ Block user while callback request pending
4. ✅ Requester goes offline during accept flow
5. ✅ localStorage quota exceeded scenario
6. ✅ Invalid timestamp data handling
7. ✅ Multiple pending requests for same user

## Summary of Required Fixes

### ✅ Fixed (Critical):
1. ✅ **FIXED** - Memory leak in CallbackManager setTimeout timers - Added `requestTimeouts` Map to track and clear timeouts
2. ✅ **FIXED** - Race condition in mutual callback detection - Now checks for reverse request BEFORE creating new request
3. ✅ **FIXED** - Missing validation for originalCallTimestamp - Added validation for date range and format
4. ✅ **FIXED** - Memory leak in CallHistorySidebar setTimeout - Added useRef and cleanup in useEffect
5. ✅ **FIXED** - Missing cleanup of blocked users' pending requests - Added cancellation logic in user:block handler
6. ✅ **FIXED** - Missing re-validation of block status on accept - Added block status check before accepting

### Should Fix (Medium):
7. Better error handling for offline requester
8. Handle multiple pending requests better
9. Input validation for toUserId - ✅ **FIXED** - Added validation

### Should Fix (Medium):
7. Better error handling for offline requester
8. Handle multiple pending requests better
9. Input validation for toUserId

### Nice to Have (Low):
10. localStorage quota handling
11. Debouncing for rapid callback requests
12. User notifications for errors

## Code Quality Score: 7/10

**Strengths:**
- Well-structured code
- Good separation of concerns
- Proper TypeScript usage
- Good error handling in most places

**Weaknesses:**
- Memory leaks need fixing
- Some race conditions
- Missing validations
- Incomplete cleanup in some scenarios

## Recommendation

**Status:** ✅ **Production Ready** - All critical issues have been fixed

**Priority:** Critical issues (#1-6) have been addressed. Medium priority issues (#7-8) can be addressed in next iteration but don't block production deployment.

## Fixes Applied

### 1. Memory Leak Fix (CallbackManager)
- Added `requestTimeouts` Map to track all setTimeout timers
- Clear timeout in `removeRequest` method
- Prevents accumulation of orphaned timers

### 2. Race Condition Fix (Mutual Callback)
- Changed flow to check for reverse request BEFORE creating new request
- Prevents both requests from being created simultaneously
- More efficient and eliminates race condition

### 3. Validation Fix (originalCallTimestamp)
- Added validation for date format and range
- Only accepts past dates within last year
- Prevents invalid data from causing issues

### 4. Memory Leak Fix (CallHistorySidebar)
- Added `useRef` to track timeout
- Added cleanup in `useEffect` return function
- Prevents memory leaks on component unmount

### 5. Block Cleanup Fix
- Added logic to cancel pending callback requests when user blocks someone
- Notifies other user if they're online
- Prevents blocked users from receiving callback notifications

### 6. Re-validation Fix (Accept)
- Added block status check before accepting callback
- Prevents blocked users from connecting via callback
- Ensures security even if block happens after request

### 7. Input Validation Fix
- Added validation for `toUserId` (empty, null, type check)
- Prevents invalid requests from being processed

