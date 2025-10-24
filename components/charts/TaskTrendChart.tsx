'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface TrendData {
  date: string;
  opened: number;
  closed: number;
}

interface TaskTrendChartProps {
  data: TrendData[];
  onTimeRangeChange?: (days: number) => void;
}

/**
 * TaskTrendChart Component
 * 
 * Displays a line chart showing tasks opened vs closed over time.
 * Includes time range filter and area fill under the lines.
 */
export function TaskTrendChart({ data, onTimeRangeChange }: TaskTrendChartProps) {
  const [timeRange, setTimeRange] = useState(7);

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    onTimeRangeChange?.(days);
  };

  if (!data || data.length === 0) {
    return (
      <div className="card-standard h-80 flex items-center justify-center">
        <div className="text-gray-500">No trend data available</div>
      </div>
    );
  }

  return (
    <div className="card-standard">
      <div className="px-2 py-1 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Task Trends</h3>
            <p className="text-xs text-gray-600">Tasks opened vs closed over time</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeRangeChange(7)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeRange === 7 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => handleTimeRangeChange(30)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeRange === 30 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30D
            </button>
          </div>
        </div>
      </div>
      <div className="p-1 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
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
                fontSize: '14px'
              }}
              formatter={(value: number, name: string) => [
                value, 
                name === 'opened' ? 'Opened' : 'Closed'
              ]}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="opened"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="closed"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
