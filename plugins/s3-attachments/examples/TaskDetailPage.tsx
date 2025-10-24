/**
 * Example: Task Detail Page with S3 Attachments
 * 
 * This example shows how to integrate the S3 attachments plugin into a task detail page.
 * 
 * Usage: Copy this example to your task detail page and customize as needed.
 */

'use client';

import React from 'react';
import AttachmentList from '@/components/AttachmentList';

interface TaskDetailPageProps {
  taskId: string;
  orgId: string;
  projectName: string;
  // ... other props
}

export default function TaskDetailPage({ 
  taskId, 
  orgId, 
  projectName 
}: TaskDetailPageProps) {
  
  const handleUpload = async (file: File) => {
    console.log('File uploaded:', file.name);
    // Add any custom logic after upload
  };

  const handleDelete = async (attachmentId: string) => {
    console.log('Attachment deleted:', attachmentId);
    // Add any custom logic after delete
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Task details */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        <p className="text-gray-600">Manage your task and its attachments</p>
      </div>

      {/* Task information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Task Information</h2>
        {/* Your task details here */}
        <p>Task ID: {taskId}</p>
        <p>Organization: {orgId}</p>
        <p>Project: {projectName}</p>
      </div>

      {/* Attachments section */}
      <div className="bg-white rounded-lg shadow">
        <AttachmentList
          taskId={taskId}
          orgId={orgId}
          projectName={projectName}
          onUpload={handleUpload}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
