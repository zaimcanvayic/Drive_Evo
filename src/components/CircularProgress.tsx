interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  className?: string;
  value?: number;
}

export const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, color = '#3b82f6', showValue = false, className = '', value }: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value || percentage) / 100 * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-500 transition-all duration-500 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ stroke: color }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showValue && <span className="text-2xl font-bold">{Math.round(value || percentage)}</span>}
      </div>
    </div>
  );
}; 