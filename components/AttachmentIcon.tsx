/**
 * AttachmentIcon Component
 * 
 * @fileoverview Small paperclip icon with count badge for task attachments
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';

interface AttachmentIconProps {
  taskId: string;
  attachmentCount: number;
  onClick: () => void;
  className?: string;
}

export function AttachmentIcon({ 
  taskId, 
  attachmentCount, 
  onClick, 
  className = '' 
}: AttachmentIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center
        w-6 h-6 rounded-md
        bg-background border border-border
        hover:bg-panel hover:border-border-hover
        transition-colors duration-200
        ${className}
      `}
      title={`${attachmentCount} attachment${attachmentCount !== 1 ? 's' : ''}`}
    >
      {/* Paperclip Icon */}
      <svg
        className="w-3 h-3 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
      
      {/* Count Badge */}
      {attachmentCount > 0 && (
        <span className="
          absolute -top-1 -right-1
          min-w-[16px] h-4
          bg-primary text-primary-foreground
          text-xs font-medium
          rounded-full
          flex items-center justify-center
          px-1
        ">
          {attachmentCount > 99 ? '99+' : attachmentCount}
        </span>
      )}
    </button>
  );
}
