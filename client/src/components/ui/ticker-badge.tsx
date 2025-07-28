interface TickerBadgeProps {
  ticker: string;
  category: string;
  size?: "sm" | "md" | "lg";
}

const getCategoryBadgeStyle = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'stock':
      return 'bg-blue-500 text-white';
    case 'etf':
      return 'bg-green-500 text-white';
    case 'crypto':
      return 'bg-orange-500 text-white';
    case 'bond':
      return 'bg-purple-500 text-white';
    case 'fund':
      return 'bg-purple-500 text-white';
    case 'cash':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return 'w-6 h-6 text-xs';
    case 'lg':
      return 'w-12 h-12 text-lg';
    default:
      return 'w-8 h-8 text-sm';
  }
};

export default function TickerBadge({ ticker, category, size = "md" }: TickerBadgeProps) {
  const displayLetter = ticker.charAt(0).toUpperCase();
  
  return (
    <div 
      className={`
        ${getCategoryBadgeStyle(category)}
        ${getSizeClasses(size)}
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-bold 
        uppercase 
        flex-shrink-0
      `}
    >
      {displayLetter}
    </div>
  );
}