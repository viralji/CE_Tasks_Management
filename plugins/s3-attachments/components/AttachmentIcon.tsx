/**
 * AttachmentIcon Component - Modular Plugin
 * 
 * Small attachment icon with count badge for displaying attachment status.
 * 
 * Usage: Copy this file to your-project/components/AttachmentIcon.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';

interface AttachmentIconProps {
  taskId: string;
  orgId: string;
  projectName: string;
  onClick?: () => void;
  className?: string;
  showCount?: boolean;
}

interface AttachmentCount {
  count: number;
  hasAttachments: boolean;
}

export default function AttachmentIcon({ 
  taskId, 
  orgId, 
  projectName, 
  onClick,
  className = '',
  showCount = true
}: AttachmentIconProps) {
  const [attachmentCount, setAttachmentCount] = useState<AttachmentCount>({ count: 0, hasAttachments: false });
  const [loading, setLoading] = useState(true);

  // Load attachment count on mount
  useEffect(() => {
    loadAttachmentCount();
  }, [taskId]);

  const loadAttachmentCount = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tasks/${taskId}/attachments`);
      
      if (response.ok) {
        const data = await response.json();
        const attachments = data.data || [];
        setAttachmentCount({
          count: attachments.length,
          hasAttachments: attachments.length > 0
        });
      }
      
    } catch (err) {
      console.error('Failed to load attachment count:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-300 rounded-full h-6 w-6"></div>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative">
        <svg 
          className={`h-5 w-5 ${attachmentCount.hasAttachments ? 'text-blue-600' : 'text-gray-400'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
          />
        </svg>
        
        {showCount && attachmentCount.count > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {attachmentCount.count > 99 ? '99+' : attachmentCount.count}
          </span>
        )}
      </div>
    </div>
  );
}
