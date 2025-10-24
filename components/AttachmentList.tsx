/**
 * AttachmentList Component
 * 
 * @fileoverview Reusable component for displaying and managing task attachments
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { errorHandler } from '@/lib/utils/errorHandler';

interface Attachment {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
  download_url?: string;
}

interface AttachmentListProps {
  taskId: string;
  attachments: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function AttachmentList({ 
  taskId, 
  attachments, 
  onUpload, 
  onDelete, 
  onRefresh 
}: AttachmentListProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      errorHandler.handleError(error as Error, { context: 'upload attachment' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    setDeleting(attachmentId);
    try {
      await onDelete(attachmentId);
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'delete attachment' });
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border border-border rounded-md p-4 bg-panel">
        <h4 className="text-sm font-medium mb-3">Upload Attachment</h4>
        
        <div className="space-y-3">
          <div>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="form-input w-full"
              accept="*/*"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center justify-between bg-background rounded-md p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getFileIcon(selectedFile.type)}</span>
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-text-muted">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          Attachments ({attachments.length})
        </h4>
        
        {attachments.length === 0 ? (
          <div className="text-center py-6 text-text-muted">
            <div className="text-2xl mb-2">📎</div>
            <p className="text-sm">No attachments yet</p>
            <p className="text-xs">Upload a file to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between bg-background rounded-md p-3 border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {attachment.original_filename}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({formatFileSize(attachment.file_size)})
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>by {attachment.uploaded_by_name}</span>
                      <span>•</span>
                      <span>{formatDate(attachment.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Generate download URL
                      fetch(`/api/tasks/${taskId}/attachments/${attachment.id}`)
                        .then(res => {
                          if (!res.ok) {
                            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                          }
                          return res.json();
                        })
                        .then(data => {
                          if (data.data?.download_url) {
                            window.open(data.data.download_url, '_blank');
                          } else {
                            console.error('No download URL in response:', data);
                            errorHandler.handleError(new Error('No download URL received'), { context: 'download attachment' });
                          }
                        })
                        .catch(error => {
                          console.error('Download error:', error);
                          errorHandler.handleError(error as Error, { context: 'download attachment' });
                        });
                    }}
                    className="btn-secondary btn-sm"
                  >
                    Download
                  </button>
                  
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleting === attachment.id}
                    className="btn-danger btn-sm disabled:opacity-50"
                  >
                    {deleting === attachment.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
