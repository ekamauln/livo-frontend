interface PaginationStatusProps {
  currentPage: number;
  limit: number;
  total: number;
  itemName?: string;
}

export function PaginationStatus({
  currentPage,
  limit,
  total,
  itemName = "items",
}: PaginationStatusProps) {
  return (
    <div className="text-sm text-muted-foreground">
      Showing {(currentPage - 1) * limit + 1} to{" "}
      {Math.min(currentPage * limit, total)} of {total} {itemName}
    </div>
  );
}
