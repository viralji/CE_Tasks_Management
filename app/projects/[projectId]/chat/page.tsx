/**
 * Project Chat Page
 * 
 * A fully functional chat interface for project collaboration.
 * Supports @mentions, real-time updates, and message history.
 * 
 * @fileoverview Project chat interface with mention support
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

interface ChatMessage {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_email: string;
  created_at: string;
  mentions: string[];
  is_mention_to_me: boolean;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages on mount
  useEffect(() => {
    if (!session || !projectId) return;
    
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chat/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages || []);
          setRoomId(data.data.roomId);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [session, projectId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!session || !projectId || !roomId) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chat/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages || []);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [session, projectId, roomId]);

  // Handle sending messages
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() })
      });

      if (response.ok) {
        setText('');
        
        // Mark all mentions in this room as read since user is actively participating
        if (roomId) {
          try {
            await fetch('/api/chat/mentions/mark-read-room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId })
            });
          } catch (error) {
            console.error('Error marking room mentions as read:', error);
          }
        }
        
        // Messages will be updated by polling
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Highlight @mentions in message content
  const highlightMentions = (content: string) => {
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="bg-blue-200 text-blue-800 font-medium px-1 rounded">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] bg-panel border border-border rounded-md flex items-center justify-center">
        <div className="text-text-muted">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <a 
          href={`/projects/${projectId}`}
          className="text-text-muted hover:text-text-base smooth-transition"
        >
          ← Back to Project
        </a>
      </div>
      
      <div className="grid grid-rows-[1fr_auto] h-[70vh] bg-panel border border-border rounded-md">
      <div className="overflow-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.author_id === (session as any)?.user?.id;
            return (
              <div key={message.id} className={`max-w-[70%] text-sm ${isMe ? 'ml-auto text-right' : ''}`}>
                {!isMe && (
                  <div className="text-xs text-text-muted mb-1 font-medium">
                    {message.author_name} <span className="text-text-muted font-normal">({message.author_email})</span>
                  </div>
                )}
                <div className={`inline-block px-3 py-2 rounded-lg border ${
                  isMe 
                    ? 'bg-primary text-white border-transparent' 
                    : message.is_mention_to_me 
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                      : 'bg-subtle border-border text-text-base'
                }`}>
                  {highlightMentions(message.content)}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {formatTime(message.created_at)}
                  {message.is_mention_to_me && (
                    <span className="ml-2 text-yellow-600 font-medium">@mention</span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form
        className="border-t border-border flex items-center gap-2 p-3"
        onSubmit={handleSubmit}
      >
        <input
          className="flex-1 bg-subtle border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Type a message... Use @username to mention someone"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSending}
        />
        <button 
          type="submit"
          disabled={isSending || !text.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-fg text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
      </div>
    </div>
  );
}


