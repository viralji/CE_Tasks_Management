'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectData {
  name: string;
  taskCount: number;
}

interface TopProjectsChartProps {
  data: ProjectData[];
}

/**
 * TopProjectsChart Component
 * 
 * Displays a bar chart showing the top 5 projects by task count.
 * Uses blue gradient bars with tooltips showing exact counts.
 */
export function TopProjectsChart({ data }: TopProjectsChartProps) {
  console.log('TopProjectsChart data:', data);
  
  // Use sample data if no data provided for testing
  const chartData = data && data.length > 0 ? data : [
    { name: 'Test Project 1', taskCount: 5 },
    { name: 'Test Project 2', taskCount: 3 },
    { name: 'Test Project 3', taskCount: 2 },
    { name: 'Test Project 4', taskCount: 1 },
    { name: 'Test Project 5', taskCount: 0 }
  ];
  
  if (!data || data.length === 0) {
    return (
      <div className="card-standard h-40 flex items-center justify-center">
        <div className="text-gray-500">No project data available</div>
      </div>
    );
  }

  return (
    <div className="card-standard">
      <div className="px-2 py-1 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Top 5 Projects</h3>
        <p className="text-xs text-gray-600">Projects with most tasks</p>
      </div>
      <div className="p-1 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              fontSize={9}
              angle={-45}
              textAnchor="end"
              height={25}
              interval={0}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={10}
              tickFormatter={(value) => value.toString()}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              formatter={(value: number) => [value, 'Tasks']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Bar 
              dataKey="taskCount" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={80}
              stroke="#2563EB"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
