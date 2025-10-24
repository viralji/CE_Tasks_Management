'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  user_count?: number;
}

interface AwsSettings {
  id?: string;
  org_id: string;
  s3_bucket_name: string;
  s3_region: string;
  s3_bucket_path_prefix: string;
  max_file_size_mb: number;
  allowed_file_types: string[] | null;
  aws_access_key_encrypted?: string;
  aws_secret_key_encrypted?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminOrgsPage() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [awsSettings, setAwsSettings] = useState<AwsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [formData, setFormData] = useState({
    aws_access_key: '',
    aws_secret_key: '',
    s3_bucket_name: '',
    s3_region: 'ap-south-1',
    s3_bucket_path_prefix: '',
    max_file_size_mb: 50,
    allowed_file_types: [] as string[]
  });

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/admin/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.data || []);
          if (data.data && data.data.length > 0 && !selectedOrg) {
            setSelectedOrg(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [selectedOrg]);

  // Fetch AWS settings for selected org
  useEffect(() => {
    if (selectedOrg) {
      const fetchAwsSettings = async () => {
        try {
          const response = await fetch(`/api/admin/organizations/${selectedOrg}/aws-settings`);
          if (response.ok) {
            const data = await response.json();
            setAwsSettings(data.data);
            if (data.data) {
              setFormData({
                aws_access_key: data.data.aws_access_key_encrypted || '',
                aws_secret_key: data.data.aws_secret_key_encrypted || '',
                s3_bucket_name: data.data.s3_bucket_name || '',
                s3_region: data.data.s3_region || 'ap-south-1',
                s3_bucket_path_prefix: data.data.s3_bucket_path_prefix || '',
                max_file_size_mb: data.data.max_file_size_mb || 50,
                allowed_file_types: data.data.allowed_file_types || []
              });
            }
          }
        } catch (error) {
          console.error('Error fetching AWS settings:', error);
        }
      };

      fetchAwsSettings();
    }
  }, [selectedOrg]);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;

    setCreatingOrg(true);
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(prev => [...prev, data.data]);
        setSelectedOrg(data.data.id);
        setNewOrgName('');
        setShowNewOrgForm(false);
      } else {
        const errorData = await response.json();
        alert(`Error creating organization: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Error creating organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleSaveAwsSettings = async () => {
    if (!selectedOrg) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg}/aws-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setAwsSettings(data.data);
        alert('AWS settings saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error saving settings: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving AWS settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const selectedOrgData = organizations.find(org => org.id === selectedOrg);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-base">Organizations</h1>
          <p className="text-text-muted">Manage organizations and their AWS settings</p>
        </div>
        <button
          onClick={() => setShowNewOrgForm(true)}
          className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-colors"
        >
          + New Organization
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-1">
          <div className="bg-panel border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-base">All Organizations</h2>
            </div>
            <div className="p-4 space-y-2">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrg(org.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedOrg === org.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-subtle hover:bg-border'
                  }`}
                >
                  <div className="font-medium text-text-base">{org.name}</div>
                  <div className="text-xs text-text-muted">
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {organizations.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  <div className="w-12 h-12 mx-auto mb-3 bg-subtle rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p>No organizations yet</p>
                  <p className="text-xs">Create your first organization</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AWS Settings */}
        <div className="lg:col-span-2">
          {selectedOrgData ? (
            <div className="bg-panel border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-text-base">AWS Settings</h2>
                <p className="text-sm text-text-muted">Configure AWS S3 for {selectedOrgData.name}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-base mb-1">
                      AWS Access Key
                    </label>
                    <input
                      type="text"
                      value={formData.aws_access_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, aws_access_key: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter AWS Access Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-base mb-1">
                      AWS Secret Key
                    </label>
                    <input
                      type="text"
                      value={formData.aws_secret_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, aws_secret_key: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter AWS Secret Key"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-base mb-1">
                      S3 Bucket Name
                    </label>
                    <input
                      type="text"
                      value={formData.s3_bucket_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, s3_bucket_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="my-bucket-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-base mb-1">
                      S3 Region
                    </label>
                    <input
                      type="text"
                      value={formData.s3_region}
                      onChange={(e) => setFormData(prev => ({ ...prev, s3_region: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="us-east-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-base mb-1">
                    Bucket Path Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.s3_bucket_path_prefix}
                    onChange={(e) => setFormData(prev => ({ ...prev, s3_bucket_path_prefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="uploads/ (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleSaveAwsSettings}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-panel border border-border rounded-lg p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-subtle rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-medium text-text-base mb-2">Select an Organization</h3>
              <p className="text-sm text-text-muted">Choose an organization to configure its AWS settings</p>
            </div>
          )}
        </div>
      </div>

      {/* New Organization Modal */}
      {showNewOrgForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-panel border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-base mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter organization name"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewOrgForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={creatingOrg || !newOrgName.trim()}
                  className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creatingOrg ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}