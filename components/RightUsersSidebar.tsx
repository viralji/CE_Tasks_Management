'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar?: string;
}

interface RightUsersSidebarProps {
  orgId: string;
}

export function RightUsersSidebar({ orgId }: RightUsersSidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [orgId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('RightUsersSidebar: Fetching users for orgId:', orgId);
      const response = await fetch(`/api/organizations/${orgId}/users`);
      console.log('RightUsersSidebar: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('RightUsersSidebar: Users data:', data);
        setUsers(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('RightUsersSidebar: Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="w-64 border-l border-border bg-panel flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text">Team Members</h2>
        <p className="text-sm text-text-dim">{users.length} users</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-subtle border border-border rounded text-sm"
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-text-dim">
            <div className="text-sm">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-text-dim">
            <div className="text-sm">
              {searchTerm ? 'No users found' : 'No users available'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-3 bg-subtle/50 hover:bg-subtle/80 rounded-lg transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-primary text-primary-fg rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text truncate">
                    {user.name || 'Unknown User'}
                  </div>
                  <div className="text-xs text-text-dim truncate">
                    {user.email}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
