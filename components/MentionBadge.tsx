/**
 * MentionBadge Component
 * 
 * Displays a badge showing the count of unread @mentions for the current user.
 * Polls the API every 10 seconds to update the count.
 * 
 * @fileoverview Badge component for unread mention notifications
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * MentionBadge Component
 * 
 * Renders a red badge with the count of unread @mentions.
 * Only shows when there are unread mentions.
 * 
 * @returns JSX element with mention badge or null
 */
export function MentionBadge() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unread mention count
  const fetchUnreadCount = async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/chat/mentions/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread mentions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [session]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [session]);

  // Don't show badge if loading or no unread mentions
  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
    </div>
  );
}
