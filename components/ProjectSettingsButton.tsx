'use client';

import { useState } from 'react';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { ProjectSettings } from '@/lib/data/projects';

interface ProjectSettingsButtonProps {
  projectId: string;
}

export function ProjectSettingsButton({ projectId }: ProjectSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async (settings: Partial<ProjectSettings>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Optionally refresh the page or show a success message
      window.location.reload();
    } catch (error) {
      console.error('Error saving project settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 text-sm border border-border rounded hover:bg-subtle flex items-center gap-2"
      >
        ⚙️ Settings
      </button>
      
      <ProjectSettingsModal
        projectId={projectId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
