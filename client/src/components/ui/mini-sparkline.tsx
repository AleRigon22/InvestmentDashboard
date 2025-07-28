interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export default function MiniSparkline({ 
  data, 
  width = 60, 
  height = 20, 
  color = '#3B82F6',
  className = '' 
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return <div className={`${className}`} style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) {
    // All values are the same, draw a flat line
    const y = height / 2;
    return (
      <svg width={width} height={height} className={className}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={`0,${y} ${width},${y}`}
        />
      </svg>
    );
  }

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Determine if trend is positive or negative
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = isPositive ? '#10B981' : '#EF4444'; // green for up, red for down

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Optional: Add dots for start and end */}
      <circle
        cx={0}
        cy={height - ((data[0] - min) / range) * height}
        r="1"
        fill={lineColor}
        opacity="0.6"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="1"
        fill={lineColor}
      />
    </svg>
  );
}