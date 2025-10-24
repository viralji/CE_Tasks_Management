/**
 * AttachmentList Component - Modular Plugin
 * 
 * Reusable React component for displaying and managing S3 file attachments.
 * 
 * Usage: Copy this file to your-project/components/AttachmentList.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Attachment } from '@/plugins/s3-attachments/S3AttachmentManager';

interface AttachmentListProps {
  taskId: string;
  orgId: string;
  projectName: string;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => Promise<void>;
  className?: string;
}

interface AttachmentItem extends Attachment {
  downloadUrl?: string;
}

export default function AttachmentList({ 
  taskId, 
  orgId, 
  projectName, 
  onUpload, 
  onDelete,
  className = '' 
}: AttachmentListProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load attachments on mount
  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tasks/${taskId}/attachments`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAttachments(data.data || []);
      
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Reload attachments
      await loadAttachments();
      
      // Call custom upload handler if provided
      if (onUpload) {
        await onUpload(file);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const downloadUrl = data.data.download_url;
      
      // Open download URL in new tab
      window.open(downloadUrl, '_blank');
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Remove from local state
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      
      // Call custom delete handler if provided
      if (onDelete) {
        await onDelete(attachmentId);
      }

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading attachments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
          <label
            htmlFor="file-upload"
            className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2">No attachments yet</p>
          <p className="text-sm">Upload a file to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.originalFilename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)} • {formatDate(attachment.uploadedAt)} • {attachment.uploadedByName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(attachment.id)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  title="Download"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
