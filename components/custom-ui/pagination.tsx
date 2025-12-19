import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;

            if (totalPages <= 5) {
              // If total pages is 5 or less, show all pages
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              // If current page is in first 3 pages, show 1,2,3,4,5
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If current page is in last 3 pages, show last 5 pages
              pageNumber = totalPages - 4 + i;
            } else {
              // Otherwise, center the current page
              pageNumber = currentPage - 2 + i;
            }

            if (pageNumber < 1 || pageNumber > totalPages) return null;

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                className="w-10 cursor-pointer"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="cursor-pointer"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
    </div>
  );
}
