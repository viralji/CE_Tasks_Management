# Chat Feature Testing Guide

## Overview
This guide provides step-by-step instructions for testing the project chat feature with @mentions, real-time updates, and notification badges.

## Prerequisites
- Two different browsers (Chrome and Edge recommended)
- Two test user accounts:
  - `v.cloudextel` (existing user)
  - `a.a@cloudextel.com` (newly created test user)
- Both users should be members of the test project: `87d4fe9f-ea33-4cba-b3cf-5e7475603e37`

## Test Setup

### 1. User Account Setup
Both test users are already created and added to the project:
- **v.cloudextel**: Existing user with admin privileges
- **a.a@cloudextel.com**: New test user with viewer privileges

### 2. Browser Setup
- **Browser 1 (Chrome)**: Login as `v.cloudextel`
- **Browser 2 (Edge)**: Login as `a.a@cloudextel.com`

## Testing Scenarios

### Scenario 1: Basic Chat Functionality

#### Steps:
1. **User v.cloudextel (Chrome)**:
   - Navigate to `http://localhost:3000/projects/87d4fe9f-ea33-4cba-b3cf-5e7475603e37/chat`
   - Verify chat interface loads
   - Send message: "Hello, this is a test message"
   - Verify message appears in chat

2. **User a.a@cloudextel.com (Edge)**:
   - Navigate to same chat URL
   - Verify message from v.cloudextel appears
   - Send reply: "Hi! I can see your message"
   - Verify both messages are visible

#### Expected Results:
- Messages appear in real-time (within 3 seconds)
- Messages show author name and timestamp
- Auto-scroll to bottom works
- Both users see all messages

### Scenario 2: @Mention Functionality

#### Steps:
1. **User v.cloudextel (Chrome)**:
   - Send message: "Hello @a.a, can you help with this task?"
   - Verify @a.a is highlighted in the message
   - Check for mention badge in navigation (should appear)

2. **User a.a@cloudextel.com (Edge)**:
   - Verify mention badge appears next to username in navigation
   - Navigate to chat
   - Verify message with @mention is highlighted in yellow
   - Verify "@mention" indicator appears below the message
   - Send reply: "Sure @v.cloudextel, I can help!"

3. **User v.cloudextel (Chrome)**:
   - Verify mention badge updates
   - Navigate to chat
   - Verify reply with @mention is highlighted

#### Expected Results:
- @mentions are highlighted in blue
- Mentioned messages have yellow background
- Mention badges show unread count
- Badges update within 10 seconds
- Badges clear when viewing chat

### Scenario 3: Real-time Updates

#### Steps:
1. **User v.cloudextel (Chrome)**:
   - Send multiple messages quickly
   - Verify messages appear in order

2. **User a.a@cloudextel.com (Edge)**:
   - Verify all messages appear in real-time
   - Send messages while v.cloudextel is viewing
   - Verify v.cloudextel sees new messages

#### Expected Results:
- Messages appear within 3 seconds
- No duplicate messages
- Proper message ordering
- Auto-scroll works for new messages

### Scenario 4: Mention Badge Persistence

#### Steps:
1. **User a.a@cloudextel.com (Edge)**:
   - Navigate away from chat to another page
   - Verify mention badge still shows
   - Navigate back to chat
   - Verify badge clears after viewing

2. **User v.cloudextel (Chrome)**:
   - Send another @mention: "@a.a please check this"
   - Verify badge appears for a.a@cloudextel.com

#### Expected Results:
- Badges persist across page navigation
- Badges clear when viewing chat
- Badges update in real-time

## Troubleshooting

### Common Issues:

1. **Messages not appearing**:
   - Check browser console for errors
   - Verify API endpoints are working
   - Check database connection

2. **Mention badges not updating**:
   - Verify polling is working (check network tab)
   - Check API response for unread count
   - Verify user is properly authenticated

3. **@mentions not highlighting**:
   - Check message content for proper @username format
   - Verify mention extraction logic
   - Check database for mention records

### Debug Steps:

1. **Check API Endpoints**:
   ```bash
   # Test message fetching
   curl -X GET "http://localhost:3000/api/projects/87d4fe9f-ea33-4cba-b3cf-5e7475603e37/chat/messages"
   
   # Test mention count
   curl -X GET "http://localhost:3000/api/chat/mentions/unread"
   ```

2. **Check Database**:
   ```sql
   -- Check chat messages
   SELECT * FROM chat_message WHERE org_id = (SELECT id FROM organization LIMIT 1);
   
   -- Check mentions
   SELECT * FROM chat_mention WHERE org_id = (SELECT id FROM organization LIMIT 1);
   ```

3. **Check Browser Console**:
   - Look for JavaScript errors
   - Check network requests
   - Verify polling intervals

## Success Criteria

### ✅ Chat Functionality
- [ ] Messages send and receive successfully
- [ ] Real-time updates work (within 3 seconds)
- [ ] Auto-scroll to bottom works
- [ ] Message history persists

### ✅ @Mention Functionality
- [ ] @mentions are highlighted in messages
- [ ] Mentioned messages have visual indicators
- [ ] Mention badges appear in navigation
- [ ] Badges update in real-time (within 10 seconds)
- [ ] Badges clear when viewing chat

### ✅ User Experience
- [ ] Clean, intuitive interface
- [ ] Proper message formatting
- [ ] Responsive design
- [ ] Error handling

### ✅ Technical Implementation
- [ ] Database operations work correctly
- [ ] API endpoints respond properly
- [ ] Polling updates work reliably
- [ ] No memory leaks or performance issues

## Test Data

### Sample Messages for Testing:
1. "Hello everyone!"
2. "Hey @a.a, can you review this?"
3. "Sure @v.cloudextel, I'll take a look"
4. "Thanks @a.a for the help!"
5. "No problem @v.cloudextel, happy to help!"

### Expected @Mention Patterns:
- `@v.cloudextel` - should mention v.cloudextel user
- `@a.a` - should mention a.a@cloudextel.com user
- `@invalid` - should not create mention (user doesn't exist)

## Performance Expectations

- **Message Polling**: Every 3 seconds
- **Badge Polling**: Every 10 seconds
- **Message Display**: Immediate after send
- **Mention Processing**: Immediate
- **Badge Updates**: Within 10 seconds

## Browser Compatibility

Tested on:
- Chrome (latest)
- Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Considerations

- Messages are scoped by organization
- Users can only see messages from projects they're members of
- @mentions only work for users in the same organization
- All API endpoints require authentication

---

**Testing Guide Version**: 1.0  
**Last Updated**: October 2025  
**Maintainer**: CloudExtel Development Team
