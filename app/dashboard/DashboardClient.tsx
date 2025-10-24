'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { TopProjectsChart } from '@/components/charts/TopProjectsChart';
import { UsersWithTasksChart } from '@/components/charts/UsersWithTasksChart';
import Link from 'next/link';

interface DashboardData {
  taskCounts: Record<string, number>;
  usersWithTasks: Array<{
    id: string;
    name: string;
    email: string;
    openTasks: number;
  }>;
  topProjects: Array<{
    id: string;
    name: string;
    taskCount: number;
  }>;
  overdueCount: number;
  avgAging: number;
  maxAging: Array<{
    id: string;
    title: string;
    projectName: string;
    daysOverdue: number;
  }>;
  superParents: Array<{
    id: string;
    name: string;
    openTasks: number;
  }>;
  completedThisWeek: number;
}

/**
 * DashboardClient Component
 * 
 * Client-side component that fetches and displays dashboard analytics.
 * Includes metric cards, charts, and super parent projects section.
 */
export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      console.log('Dashboard analytics data:', result.data);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-standard animate-pulse p-2">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card-standard animate-pulse h-48">
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-standard text-center py-8">
        <div className="text-red-600 mb-4">Failed to load analytics</div>
        <button 
          onClick={fetchAnalytics}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card-standard text-center py-8">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <MetricCard
          title="Open Tasks"
          value={data.taskCounts.OPEN || 0}
          color="blue"
        />
        <MetricCard
          title="In Progress"
          value={data.taskCounts.IN_PROGRESS || 0}
          color="blue"
        />
        <MetricCard
          title="Blocked Tasks"
          value={data.taskCounts.BLOCKED || 0}
          color="red"
        />
        <MetricCard
          title="Overdue Tasks"
          value={data.overdueCount}
          color="red"
        />
        <MetricCard
          title="Avg Aging (days)"
          value={Math.round(data.avgAging)}
          color="black"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopProjectsChart data={data.topProjects} />
        <UsersWithTasksChart data={data.usersWithTasks} />
      </div>

      {/* Super Parent Projects */}
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Super Parent Projects</h3>
          <p className="text-xs text-gray-600">Root projects with their open task counts</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.superParents.map((project) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.id}`}
              className="card-standard hover:shadow-md smooth-transition hover:border-primary/30 p-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{project.name}</h4>
                  <p className="text-xs text-gray-600">Root</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{project.openTasks}</div>
                  <div className="text-xs text-gray-500">Tasks</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
