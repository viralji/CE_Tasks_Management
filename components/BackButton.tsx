'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function BackButton({ href, onClick, children, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 text-text-muted hover:text-text-base smooth-transition ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span className="text-sm font-medium">
        {children || 'Back'}
      </span>
    </button>
  );
}
