'use client';
import { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string;
  primary_email: string;
  image?: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  added_at: string;
}

interface ProjectMembersSidebarProps {
  projectId: string;
  members?: Member[];
}

function MemberItem({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-hover smooth-transition group">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-fg flex items-center justify-center text-sm font-medium">
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-8 h-8 rounded-full" />
        ) : (
          member.name?.charAt(0)?.toUpperCase() || '?'
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-base truncate">{member.name}</div>
        <div className="text-xs text-text-muted truncate">{member.primary_email}</div>
        <div className="text-xs text-text-muted capitalize">{member.role.toLowerCase()}</div>
      </div>
    </div>
  );
}

export function ProjectMembersSidebar({ projectId, members: propMembers }: ProjectMembersSidebarProps) {
  const [members, setMembers] = useState<Member[]>(propMembers || []);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [loading, setLoading] = useState(!propMembers);

  // Fetch members if not provided as prop
  useEffect(() => {
    if (!propMembers && projectId) {
      const fetchMembers = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/projects/${projectId}/members`);
          if (response.ok) {
            const data = await response.json();
            setMembers(data.data || []);
          }
        } catch (error) {
          console.error('Error fetching project members:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [projectId, propMembers]);

  useEffect(() => {
    // Fetch users not in project
    fetch(`/api/projects/${projectId}/members?available=true`)
      .then(res => res.json())
      .then(data => setAvailableUsers(data.data || []))
      .catch(console.error);
  }, [projectId]);

  const handleAddUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'VIEWER' })
      });
      
      if (response.ok) {
        // Refresh the members list
        const membersResponse = await fetch(`/api/projects/${projectId}/members`);
        if (membersResponse.ok) {
          const data = await membersResponse.json();
          setMembers(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  // Ensure members is defined and is an array
  const safeMembers = members || [];

  if (loading) {
    return (
      <div className="sidebar-right h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="section-header">Project Members</h3>
          <p className="text-xs text-text-muted mt-1">Loading...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-text-muted">Loading members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-right h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="section-header">Project Members</h3>
        <p className="text-xs text-text-muted mt-1">{safeMembers.length} members</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {safeMembers.map((member) => (
            <div key={member.id} className="relative group">
              <MemberItem member={member} />
              <button
                onClick={() => handleRemoveUser(member.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-text-dim hover:text-red-600 transition-opacity"
                title="Remove user"
              >
                ×
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center text-text-muted text-sm py-8">
              No members yet
            </div>
          )}
        </div>

        {/* Add user section */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="w-full text-left text-sm text-primary hover:text-primary/80 font-medium"
          >
            + Add User
          </button>

          {isAddingUser && (
            <div className="mt-3 space-y-2">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-hover smooth-transition cursor-pointer"
                  onClick={() => handleAddUser(user.id)}
                >
                  <div className="w-6 h-6 rounded-full bg-subtle text-text-muted flex items-center justify-center text-xs font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-base truncate">{user.name}</div>
                    <div className="text-xs text-text-muted truncate">{user.primary_email}</div>
                  </div>
                </div>
              ))}

              {availableUsers.length === 0 && (
                <div className="text-xs text-text-muted text-center py-2">
                  All users are already members
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
