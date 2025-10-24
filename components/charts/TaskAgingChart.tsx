'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgingData {
  id: string;
  title: string;
  projectName: string;
  daysOverdue: number;
}

interface TaskAgingChartProps {
  data: AgingData[];
}

/**
 * TaskAgingChart Component
 * 
 * Displays a horizontal bar chart showing the most overdue tasks.
 * Color gradient from yellow to red based on days overdue.
 * Click to navigate to task detail.
 */
export function TaskAgingChart({ data }: TaskAgingChartProps) {
  const router = useRouter();

  if (!data || data.length === 0) {
    return (
      <div className="card-standard h-80 flex items-center justify-center">
        <div className="text-gray-500">No overdue tasks</div>
      </div>
    );
  }

  const getBarColor = (daysOverdue: number) => {
    if (daysOverdue <= 7) return '#F59E0B'; // Yellow
    if (daysOverdue <= 14) return '#F97316'; // Orange
    if (daysOverdue <= 30) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };

  const handleBarClick = (taskId: string) => {
    // Navigate to task detail (you might need to adjust this route)
    router.push(`/tasks/${taskId}`);
  };

  return (
    <div className="card-standard">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Most Overdue Tasks</h3>
        <p className="text-sm text-gray-600">Tasks past due date</p>
      </div>
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              type="number"
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => `${value}d`}
            />
            <YAxis 
              type="category"
              dataKey="title"
              stroke="#6B7280"
              fontSize={12}
              width={90}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => {
                // Truncate long titles
                return value.length > 20 ? value.substring(0, 17) + '...' : value;
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              formatter={(value: number) => [`${value} days overdue`, 'Overdue']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return `${data.title} (${data.projectName})`;
                }
                return label;
              }}
            />
            <Bar 
              dataKey="daysOverdue"
              onClick={(data) => handleBarClick(data.id)}
              cursor="pointer"
              fill="#F59E0B"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
