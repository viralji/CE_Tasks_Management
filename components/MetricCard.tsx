'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'red' | 'green' | 'black';
  className?: string;
}

/**
 * MetricCard Component
 * 
 * A reusable card component for displaying key metrics with optional trend indicators
 * and color coding for different metric types.
 */
export function MetricCard({ 
  title, 
  value, 
  trend, 
  color = 'blue',
  className = ''
}: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    black: 'text-gray-800'
  };

  const bgColorClasses = {
    blue: 'bg-blue-100 border-blue-200',
    red: 'bg-red-100 border-red-200',
    green: 'bg-green-100 border-green-200',
    black: 'bg-gray-100 border-gray-200'
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toString();
    }
    return val;
  };

  return (
    <div className={`card-standard hover:shadow-md smooth-transition ${bgColorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-600 mb-1">{title}</div>
          <div className={`text-2xl font-bold ${colorClasses[color]}`}>
            {formatValue(value)}
          </div>
          {trend && (
            <div className={`text-xs mt-1 flex items-center ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="mr-1">
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
