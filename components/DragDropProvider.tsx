'use client';

interface DragDropProviderProps {
  children: React.ReactNode;
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  // Drag and drop functionality removed - now just a wrapper
  return <>{children}</>;
}
