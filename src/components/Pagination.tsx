import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  limit,
  onPageChange,
  onLimitChange,
  isLoading = false
}) => {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card">
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalCount} members
      </div>
      
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          disabled={isLoading}
          className="px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-muted-foreground">per page</span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage || isLoading}
          className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage || isLoading}
          className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
              disabled={typeof page !== 'number' || isLoading}
              className={`min-w-[2rem] h-8 px-2 text-sm rounded transition-colors ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : typeof page === 'number'
                  ? 'hover:bg-accent'
                  : 'cursor-default'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;