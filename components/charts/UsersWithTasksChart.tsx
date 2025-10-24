'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserData {
  id: string;
  name: string;
  email: string;
  openTasks: number;
}

interface UsersWithTasksChartProps {
  data: UserData[];
}

/**
 * UsersWithTasksChart Component
 * 
 * Displays a horizontal bar chart showing users with the most open tasks.
 * Uses blue gradient bars with user names and task counts.
 */
export function UsersWithTasksChart({ data }: UsersWithTasksChartProps) {
  console.log('UsersWithTasksChart data:', data);
  
  if (!data || data.length === 0) {
    return (
      <div className="card-standard h-48 flex items-center justify-center">
        <div className="text-gray-500">No user data available</div>
      </div>
    );
  }

  return (
    <div className="card-standard">
      <div className="px-2 py-1 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Users with Max Open Tasks</h3>
        <p className="text-xs text-gray-600">Top 5 users by open task count</p>
      </div>
      <div className="p-1 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 10, left: 10, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name"
              stroke="#6B7280"
              fontSize={9}
              angle={-45}
              textAnchor="end"
              height={25}
              interval={0}
              tickFormatter={(value) => {
                // Truncate long names
                return value.length > 6 ? value.substring(0, 4) + '...' : value;
              }}
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
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value} tasks`, 'Open Tasks']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return `${data.name} (${data.email})`;
                }
                return label;
              }}
            />
            <Bar 
              dataKey="openTasks" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
