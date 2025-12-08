"use client";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  PackagePlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { lostFoundApi } from "@/lib/api/lostFoundApi";
import { LostFoundCreateDialog } from "@/components/dialogs/lost-found-create-dialog";
import { LostFoundDialog } from "@/components/dialogs/lost-found-dialog";
import React from "react";
import { LostFound } from "@/types/lost-found";

export default function LostFoundsTable() {
  const [data, setData] = useState<LostFound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    update_at: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Dialog states
  const [selectedLostFoundId, setSelectedLostFoundId] = useState<number | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lostFoundDialogOpen, setLostFoundDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"detail" | "profile">("detail");

  // Fetch lost-founds data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await lostFoundApi.getLostFoundItems(
          page,
          pagination.limit,
          search
        );
        // Extract lost-founds array from the response data
        const lostFounds = response.data.lostFounds as LostFound[];
        setData(lostFounds);
        setPagination(response.data.pagination);
      } catch {
        toast.error("Failed to fetch lost & found items.");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchData(newPage, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, limit: newLimitValue, page: 1 }));
    fetchData(1, searchQuery);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const columns: ColumnDef<LostFound>[] = [
    {
      accessorKey: "id",
      header: () => <div className="text-sm text-center font-semibold">ID</div>,
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      accessorKey: "product_sku",
      header: () => (
        <div className="text-sm text-center font-semibold">Product SKU</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("product_sku")}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: () => (
        <div className="text-sm text-center font-semibold">Quantity</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("quantity")}
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: () => (
        <div className="text-sm text-center font-semibold">Reason</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("reason")}
        </div>
      ),
    },
    {
      accessorKey: "created_by",
      header: () => (
        <div className="text-sm text-center font-semibold">Created By</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("created_by")}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: () => (
        <div className="text-sm text-center font-semibold">Created At</div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-xs text-muted-foreground text-center">
            {format(date, "dd MMM yyyy")}
            <br />
            {format(date, "HH:mm:ss")}
          </div>
        );
      },
    },
    {
      accessorKey: "update_at",
      header: () => (
        <div className="text-sm text-center font-semibold">Updated At</div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("updated_at"));
        return (
          <div className="text-xs text-muted-foreground text-center">
            {format(date, "dd MMM yyyy")}
            <br />
            {format(date, "HH:mm:ss")}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lostFound = row.original;
        return (
          <div className="flex justify-end text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedLostFoundId(lostFound.id);
                    setDialogTab("detail");
                    setLostFoundDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedLostFoundId(lostFound.id);
                    setDialogTab("profile");
                    setLostFoundDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Lost Found
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
    manualPagination: true,
    manualFiltering: true,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex justify-start items-center gap-2">
          {/* Filters */}
          <div className="flex justify-start items-center gap-2">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2 items-center"
            >
              <Input
                placeholder="Search lost found items..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
        </div>

        <div className="flex justify-start items-center gap-2">
          {/* Create New Lost Found Item Button */}
          <div className="flex justify-start items-center gap-2">
            <Button
              variant="default"
              className="cursor-pointer rounded-md"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="flex items-center gap-2 justify-center">
                <PackagePlus className="w-4 h-4" />{" "}
                <span>Create New Lost Found</span>
              </div>
            </Button>
          </div>

          {/* Pagination limit */}
          <div className="flex justify-start items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column visibility */}
          <div className="flex justify-start items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Show / Hide
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading lost found items...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No lost found items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} lost found items
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
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
              } else if (pagination.page <= 3) {
                // If current page is in first 3 pages, show 1,2,3,4,5
                pageNumber = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                // If current page is in last 3 pages, show last 5 pages
                pageNumber = totalPages - 4 + i;
              } else {
                // Otherwise, center the current page
                pageNumber = pagination.page - 2 + i;
              }

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === pagination.page ? "default" : "outline"
                  }
                  onClick={() => handlePageChange(pageNumber)}
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
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages || isLoading}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* LostFound Dialog */}
      <LostFoundDialog
        lostFoundId={selectedLostFoundId}
        open={lostFoundDialogOpen}
        onOpenChange={setLostFoundDialogOpen}
        initialTab={dialogTab}
        onLostFoundUpdate={() => {
          // Refresh the data to show any updates
          fetchData(pagination.page, searchQuery);
        }}
      />

      {/* Create LostFound Dialog */}
      <LostFoundCreateDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLostFoundCreated={(lostFound) => {
          // Refresh the data to show the new lost found
          fetchData(pagination.page, searchQuery);
          toast.success(
            `Lost found ${lostFound.product_sku} created successfully!`
          );
        }}
      />
    </div>
  );
}
