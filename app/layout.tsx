import './globals.css';
import type { ReactNode } from 'react';
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-base antialiased">
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}


