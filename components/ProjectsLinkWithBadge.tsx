/**
 * Projects Link with Mention Badge Component
 * 
 * A navigation link component that displays the Projects menu item
 * with a mention count badge showing total unread mentions across all projects.
 * 
 * @fileoverview Projects navigation link with mention badge
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * ProjectsLinkWithBadge Component
 * 
 * Renders a Projects navigation link with a mention count badge.
 * The badge shows the total number of unread mentions across all projects.
 * 
 * @returns JSX element with Projects link and mention badge
 */
export function ProjectsLinkWithBadge() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMentions = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/chat/mentions/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread mentions:', error);
    }
  };

  useEffect(() => {
    fetchUnreadMentions(); // Fetch initially
    const interval = setInterval(fetchUnreadMentions, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [session]);

  return (
    <Link className="nav-item flex items-center gap-2" href="/projects">
      <span>Projects</span>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
