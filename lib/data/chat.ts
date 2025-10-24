import { withOrg } from '@/lib/db';

export async function getUnreadCount(orgId: string, roomId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    // If userId looks like an email, look up the actual user ID
    let actualUserId = userId;
    if (userId.includes('@')) {
      const { rows } = await client.query(
        'SELECT id FROM app_user WHERE primary_email = $1',
        [userId]
      );
      if (rows[0]) {
        actualUserId = rows[0].id;
      } else {
        // User not found, return 0 unread count
        return 0;
      }
    }
    
    // Get last read timestamp for this user in this room
    const { rows: readRows } = await client.query(
      `SELECT last_read_at FROM chat_read_status 
       WHERE org_id = $1 AND room_id = $2 AND user_id = $3`,
      [orgId, roomId, actualUserId]
    );
    
    const lastReadAt = readRows[0]?.last_read_at || new Date(0);
    
    // Count unread messages
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) as count FROM chat_message 
       WHERE org_id = $1 AND room_id = $2 AND created_at > $3`,
      [orgId, roomId, lastReadAt]
    );
    
    return parseInt(countRows[0].count);
  });
}

export async function markAsRead(orgId: string, roomId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    // If userId looks like an email, look up the actual user ID
    let actualUserId = userId;
    if (userId.includes('@')) {
      const { rows } = await client.query(
        'SELECT id FROM app_user WHERE primary_email = $1',
        [userId]
      );
      if (rows[0]) {
        actualUserId = rows[0].id;
      } else {
        // User not found, return success but do nothing
        return { success: true };
      }
    }
    
    await client.query(
      `INSERT INTO chat_read_status (org_id, room_id, user_id, last_read_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (org_id, room_id, user_id) 
       DO UPDATE SET last_read_at = now()`,
      [orgId, roomId, actualUserId]
    );
    return { success: true };
  });
}

export async function getChatRoom(orgId: string, roomId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT id, name, description, created_at FROM chat_room 
       WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [orgId, roomId]
    );
    return rows[0] || null;
  });
}

export async function getChatMessages(orgId: string, roomId: string, limit: number = 100) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT cm.id, cm.content, cm.created_at, u.name as author_name, u.image as author_image
       FROM chat_message cm
       JOIN app_user u ON u.id = cm.author_id
       WHERE cm.org_id = $1 AND cm.room_id = $2
       ORDER BY cm.created_at DESC
       LIMIT $3`,
      [orgId, roomId, limit]
    );
    return rows.reverse(); // Return in chronological order
  });
}

/**
 * Get or create a chat room for a project
 */
export async function getOrCreateChatRoom(orgId: string, projectId: string) {
  return withOrg(orgId, async (client) => {
    // Try to get existing chat room
    const { rows: existing } = await client.query(
      `SELECT id, name, created_at FROM chat_room 
       WHERE org_id = $1 AND project_id = $2`,
      [orgId, projectId]
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Create new chat room for the project
    const { rows: newRoom } = await client.query(
      `INSERT INTO chat_room (org_id, project_id, name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, created_at`,
      [orgId, projectId, `Project Chat`]
    );
    
    return newRoom[0];
  });
}

/**
 * Send a message to a chat room
 */
export async function sendMessage(orgId: string, roomId: string, authorId: string, content: string) {
  return withOrg(orgId, async (client) => {
    // Insert the message
    const { rows: message } = await client.query(
      `INSERT INTO chat_message (org_id, room_id, author_id, content, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, content, created_at`,
      [orgId, roomId, authorId, content]
    );
    
    const messageId = message[0].id;
    
    // Extract mentions and create mention records
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      await createMentions(orgId, messageId, mentions, client);
    }
    
    return message[0];
  });
}

/**
 * Extract @mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  
  return matches.map(match => match.substring(1)); // Remove @ symbol
}

/**
 * Create mention records for a message
 */
export async function createMentions(orgId: string, messageId: string, usernames: string[], client: any) {
  for (const username of usernames) {
    // Look up user by email (assuming @username format matches email)
    const email = `${username}@cloudextel.com`;
    const { rows: userRows } = await client.query(
      'SELECT id FROM app_user WHERE primary_email = $1',
      [email]
    );
    
    if (userRows.length > 0) {
      await client.query(
        `INSERT INTO chat_mention (org_id, message_id, mentioned_user_id, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (org_id, message_id, mentioned_user_id) DO NOTHING`,
        [orgId, messageId, userRows[0].id]
      );
    }
  }
}

/**
 * Get unread mention count for a user
 */
export async function getUserUnreadMentions(orgId: string, userId: string, isSuperAdmin: boolean = false) {
  if (isSuperAdmin) {
    return 0; // Super admin doesn't need mention notifications
  }
  
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT COUNT(*) as count FROM chat_mention cm
       WHERE cm.org_id = $1 AND cm.mentioned_user_id = $2 AND cm.read_at IS NULL`,
      [orgId, userId]
    );
    
    return parseInt(rows[0].count);
  });
}

/**
 * Mark mentions as read for a specific message
 */
export async function markMentionsAsRead(orgId: string, messageId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    await client.query(
      `UPDATE chat_mention 
       SET read_at = NOW() 
       WHERE org_id = $1 AND message_id = $2 AND mentioned_user_id = $3 AND read_at IS NULL`,
      [orgId, messageId, userId]
    );
    
    return { success: true };
  });
}

/**
 * Get chat messages with mention information
 */
export async function getChatMessagesWithMentions(orgId: string, roomId: string, currentUserId: string, limit: number = 100) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT 
         cm.id, 
         cm.content, 
         cm.created_at, 
         u.name as author_name, 
         u.primary_email as author_email,
         u.id as author_id,
         ARRAY_AGG(DISTINCT cm_mentions.mentioned_user_id) as mentions,
         EXISTS(
           SELECT 1 FROM chat_mention cm_check 
           WHERE cm_check.message_id = cm.id 
           AND cm_check.mentioned_user_id = $3 
           AND cm_check.read_at IS NULL
         ) as is_mention_to_me
       FROM chat_message cm
       JOIN app_user u ON u.id = cm.author_id
       LEFT JOIN chat_mention cm_mentions ON cm_mentions.org_id = cm.org_id AND cm_mentions.message_id = cm.id
       WHERE cm.org_id = $1 AND cm.room_id = $2
       GROUP BY cm.id, cm.content, cm.created_at, u.name, u.primary_email, u.id
       ORDER BY cm.created_at DESC
       LIMIT $4`,
      [orgId, roomId, currentUserId, limit]
    );
    
    return rows.reverse(); // Return in chronological order
  });
}

/**
 * Mark all mentions in a chat room as read for a user
 */
export async function markAllRoomMentionsAsRead(orgId: string, roomId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    await client.query(
      `UPDATE chat_mention cm
       SET read_at = NOW()
       FROM chat_message msg
       WHERE cm.org_id = $1 
       AND cm.message_id = msg.id
       AND msg.room_id = $2
       AND cm.mentioned_user_id = $3
       AND cm.read_at IS NULL`,
      [orgId, roomId, userId]
    );
    return { success: true };
  });
}

/**
 * Get mention counts grouped by project for a user
 */
export async function getUserMentionsByProject(orgId: string, userId: string, isSuperAdmin: boolean = false) {
  if (isSuperAdmin) {
    return []; // Super admin doesn't need mention notifications
  }
  
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT 
         p.id as project_id,
         p.name as project_name,
         COUNT(cm.message_id) as mention_count
       FROM chat_mention cm
       JOIN chat_message msg ON cm.message_id = msg.id AND cm.org_id = msg.org_id
       JOIN chat_room cr ON msg.room_id = cr.id AND msg.org_id = cr.org_id
       JOIN project p ON cr.project_id = p.id AND cr.org_id = p.org_id
       WHERE cm.org_id = $1 
       AND cm.mentioned_user_id = $2 
       AND cm.read_at IS NULL
       GROUP BY p.id, p.name
       ORDER BY mention_count DESC`,
      [orgId, userId]
    );
    return rows;
  });
}
