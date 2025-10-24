'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  organizations: { id: string; name: string; role: string }[];
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

function AssignmentModal({ user, organizations, onSave, onCancel }: {
  user: User;
  organizations: Organization[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
    user.organizations.map(org => org.id)
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationIds: selectedOrgs,
          role: 'MEMBER'
        }),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(`Failed to update user organizations: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating user organizations:', error);
      alert(`Error updating user organizations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrg = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-panel border border-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Assign Organizations to {user.name}</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {organizations.map(org => (
            <label key={org.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedOrgs.includes(org.id)}
                onChange={() => toggleOrg(org.id)}
                className="form-checkbox text-primary rounded"
              />
              <span>{org.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-border text-text-base hover:bg-subtle"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-primary text-primary-fg hover:bg-primary-dark"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      } else {
        console.error('Failed to fetch organizations:', response.status);
        setOrganizations([{ id: 'default', name: 'Default Organization' }]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([{ id: 'default', name: 'Default Organization' }]);
    }
  };

  useEffect(() => {
    if (session?.user?.isSuperAdmin) {
      fetchUsers();
      fetchOrganizations();
    } else if (session) {
      router.push('/dashboard');
    }
  }, [session, router, fetchUsers]);

  const handleAssignUser = (user: User) => {
    setSelectedUser(user);
    setShowAssignmentModal(true);
  };

  const handleModalClose = () => {
    setShowAssignmentModal(false);
    setSelectedUser(null);
    fetchUsers();
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(user => user.organizations.length === 0);
  const assignedUsers = filteredUsers.filter(user => user.organizations.length > 0);

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-base">User Management</h1>
          <p className="text-text-muted">Manage users and their organization assignments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-text-muted">Pending</p>
              <p className="text-2xl font-semibold text-text-base">{pendingUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-text-muted">Assigned</p>
              <p className="text-2xl font-semibold text-text-base">{assignedUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-text-muted">Total Users</p>
              <p className="text-2xl font-semibold text-text-base">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Users - Compact Table */}
      {pendingUsers.length > 0 && (
        <div className="bg-panel border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-base">Pending Assignment ({pendingUsers.length})</h2>
            <p className="text-sm text-text-muted">Users waiting for organization assignment</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-subtle">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingUsers.map(user => (
                  <tr key={user.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.image ? (
                          <img className="h-8 w-8 rounded-full" src={user.image} alt={user.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-text-base">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignUser(user)}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Assign →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assigned Users - Compact Table */}
      {assignedUsers.length > 0 && (
        <div className="bg-panel border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-base">Assigned Users ({assignedUsers.length})</h2>
            <p className="text-sm text-text-muted">Users with organization assignments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-subtle">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Organizations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.image ? (
                          <img className="h-8 w-8 rounded-full" src={user.image} alt={user.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-text-base">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.organizations.map(org => (
                          <span key={org.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {org.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignUser(user)}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Edit →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && (
        <div className="bg-panel border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-subtle rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-text-base mb-2">No Users Found</h3>
          <p className="text-sm text-text-muted">Users will appear here once they sign up</p>
        </div>
      )}

      {showAssignmentModal && selectedUser && (
        <AssignmentModal
          user={selectedUser}
          organizations={organizations}
          onSave={handleModalClose}
          onCancel={handleModalClose}
        />
      )}
    </div>
  );
}