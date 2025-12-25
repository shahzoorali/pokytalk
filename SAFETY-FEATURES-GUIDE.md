# Safety Features Implementation Guide

## Overview

Pokytalk now includes comprehensive safety features including:
- **User Reporting System** - Report users for inappropriate behavior
- **User Blocking** - Block users to prevent future interactions
- **AI-Powered Suspicious Behavior Detection** - Automatically detects suspicious patterns in chat messages
- **Moderation Support** - Backend moderation system with auto-ban thresholds

## Backend Implementation

### Files Created/Modified

1. **`backend/src/types.ts`**
   - Added `ReportReason` type
   - Added `UserReport` interface
   - Added `BlockedUser` interface
   - Added `ReportUserData` interface

2. **`backend/src/moderationManager.ts`** (NEW)
   - Manages user reports and blocks
   - Detects suspicious behavior in messages
   - Tracks report counts and auto-ban thresholds
   - Cleans up old reports

3. **`backend/src/socketManager.ts`** (MODIFIED)
   - Added report/block socket handlers
   - Integrated suspicious behavior detection in chat messages
   - Added block checking before sending messages

4. **`backend/src/index.ts`** (MODIFIED)
   - Initialized ModerationManager
   - Passed to SocketManager

### Backend Features

#### Report System
- Users can report others with reasons: harassment, inappropriate_content, spam, scam, personal_info_request, other
- Reports are logged and tracked
- Auto-ban after 5 reports (configurable)
- Reports include optional description and session context

#### Block System
- Users can block other users
- Blocked users cannot send messages to the blocker
- Blocked users are automatically removed from matching queue
- Block list is stored per user

#### Suspicious Behavior Detection
- Detects suspicious keywords (money requests, personal info, etc.)
- Detects spam patterns
- Detects excessive personal information requests
- Notifies partner when suspicious behavior is detected

### Socket Events

#### Client → Server
- `user:report` - Report a user
  ```typescript
  {
    reportedUserId: string;
    reason: ReportReason;
    description?: string;
    sessionId?: string;
  }
  ```

- `user:block` - Block a user
  ```typescript
  blockedUserId: string
  ```

- `user:unblock` - Unblock a user
  ```typescript
  unblockedUserId: string
  ```

- `user:blocked:list` - Get list of blocked users

#### Server → Client
- `user:report:success` - Report submitted successfully
- `user:report:error` - Report failed
- `user:block:success` - User blocked successfully
- `user:block:error` - Block failed
- `moderation:suspicious` - Suspicious behavior detected
- `moderation:warning` - Warning about report count
- `chat:error` - Chat error (e.g., blocked)

## Frontend Implementation (TODO)

### Required Changes

1. **Update `frontend/src/types.ts`**
   - Add report and block types (matching backend)

2. **Update `frontend/src/hooks/useSocket.ts`**
   - Add `reportUser()` function
   - Add `blockUser()` function
   - Add `unblockUser()` function
   - Add `getBlockedUsers()` function
   - Handle `moderation:suspicious` event
   - Handle `chat:error` event

3. **Update `frontend/src/components/ConnectionScreen.tsx`**
   - Add Report button (when in call)
   - Add Block button (when in call)
   - Add Report modal with reason selection
   - Show notification when suspicious behavior detected
   - Show notification when blocked

### UI Components Needed

1. **Report Modal**
   - Reason dropdown (harassment, inappropriate_content, spam, scam, personal_info_request, other)
   - Description textarea (optional)
   - Submit button
   - Cancel button

2. **Block Confirmation**
   - Confirmation dialog
   - "Block and Report" option
   - "Just Block" option

3. **Notifications**
   - Suspicious behavior alert
   - Block confirmation
   - Report success message

## How to Build Frontend Features

### Step 1: Add Types

Add to `frontend/src/types.ts`:

```typescript
export type ReportReason = 
  | 'harassment' 
  | 'inappropriate_content' 
  | 'spam' 
  | 'scam' 
  | 'personal_info_request' 
  | 'other';

export interface ReportUserData {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  sessionId?: string;
}
```

### Step 2: Update useSocket Hook

Add to `frontend/src/hooks/useSocket.ts`:

```typescript
// Add state
const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

// Add functions
const reportUser = useCallback((data: ReportUserData) => {
  if (socket) {
    socket.emit('user:report', data);
  }
}, [socket]);

const blockUser = useCallback((blockedUserId: string) => {
  if (socket) {
    socket.emit('user:block', blockedUserId);
  }
}, [socket]);

// Add event listeners
socket.on('user:report:success', (data) => {
  // Show success notification
});

socket.on('moderation:suspicious', (data) => {
  // Show warning notification
});

socket.on('chat:error', (message) => {
  // Show error notification
});
```

### Step 3: Add UI Components

Add Report/Block buttons to `ConnectionScreen.tsx`:

```tsx
{isInCall && partner && (
  <div className="flex space-x-2">
    <button onClick={() => setShowReportModal(true)}>
      Report
    </button>
    <button onClick={() => handleBlock(partner.id)}>
      Block
    </button>
  </div>
)}
```

## Testing

### Test Report Feature
1. Connect two users
2. User A reports User B
3. Verify User B is automatically blocked
4. Verify call ends
5. Check backend logs for report

### Test Block Feature
1. Connect two users
2. User A blocks User B
3. Verify User B cannot send messages
4. Verify call ends
5. Verify User B is in blocked list

### Test Suspicious Detection
1. Send message with suspicious keywords (e.g., "send money")
2. Verify partner receives `moderation:suspicious` event
3. Check backend logs for detection

## Configuration

### Auto-Ban Threshold
In `backend/src/moderationManager.ts`:
```typescript
private readonly AUTO_BAN_THRESHOLD = 5; // Change this value
```

### Suspicious Keywords
In `backend/src/moderationManager.ts`:
```typescript
private readonly SUSPICIOUS_KEYWORDS = [
  'send money', 'wire transfer', 'bitcoin', // Add more keywords
];
```

## Production Considerations

1. **Database Storage**: Currently reports are stored in memory. For production, store in database.

2. **Moderation Dashboard**: Build admin interface to review reports.

3. **Rate Limiting**: Add rate limiting to prevent report spam.

4. **Appeal Process**: Allow users to appeal bans.

5. **Email Notifications**: Notify admins of high-priority reports.

6. **Analytics**: Track report patterns and improve detection.

## Current Status

✅ Backend implementation complete
⏳ Frontend implementation pending
⏳ UI components pending
⏳ Testing pending

## Next Steps

1. Implement frontend types
2. Add report/block functions to useSocket
3. Create Report modal component
4. Add Report/Block buttons to UI
5. Add notifications for safety events
6. Test all features
7. Deploy and monitor

