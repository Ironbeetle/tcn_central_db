import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  children,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = ''
}) => {
  const isActive = currentSortBy === sortKey;
  
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-2 font-medium text-left hover:text-foreground transition-colors ${
        isActive ? 'text-foreground' : 'text-muted-foreground'
      } ${className}`}
    >
      {children}
      <span className="flex-shrink-0">
        {isActive ? (
          currentSortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </button>
  );
};

export default SortableHeader;