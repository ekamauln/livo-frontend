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
import { Loader2, ChevronRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { QcRibbon } from "@/types/qc-ribbon";
import { qcRibbonApi } from "@/lib/api/qcRibbonApi";
import { ApiError } from "@/lib/api/types";
import React from "react";
import { Separator } from "../ui/separator";
import { QcRibbonTrackingSearch } from "@/components/forms/qc-ribbon-tracking-search";
import { QcRibbonCreateDialog } from "@/components/dialogs/qc-ribbon-create-dialog";
import type { Order } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { QcOperatorPerformance } from "@/components/analytics/qc-ribbon-operator-performance";
import { PaginationLimit } from "@/components/custom-ui/pagination-limit";
import { Pagination } from "@/components/custom-ui/pagination";
import { PaginationStatus } from "@/components/custom-ui/pagination-status";

export default function QcRibbonsTable() {
  const [data, setData] = useState<QcRibbon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    complained: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Toggle row expansion
  const toggleRowExpansion = (rowId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Fetch qc-ribbons data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await qcRibbonApi.getQcRibbons(
          page,
          pagination.limit,
          search
        );
        // Extract qc-ribbons array from the response data
        const qcRibbons = response.data.qc_ribbons as QcRibbon[];
        setData(qcRibbons);
        setPagination(response.data.pagination);
      } catch (error) {
        // Only log unexpected errors to console to reduce noise
        if (error instanceof ApiError) {
          if (error.status >= 500 || error.status === 0) {
            console.error("Server/Network error fetching qc-ribbons:", error);
          } else {
            console.debug(
              "Client error fetching qc-ribbons:",
              error.message,
              "Status:",
              error.status
            );
          }
        } else {
          console.error("Unexpected error fetching qc-ribbons:", error);
        }

        let errorMessage = "Failed to fetch qc-ribbons. Please try again.";

        if (error instanceof ApiError) {
          if (error.status === 401) {
            errorMessage = "Session expired. Please login again.";
          } else if (error.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.status === 0) {
            errorMessage = "Network error. Please check your connection.";
          }
        }

        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit]
  );

  const handleQcRibbonCreated = () => {
    // Refresh the data after creating a new qc-ribbon
    fetchData(pagination.page, searchQuery);
  };

  const handleOrderFound = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

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

  // Render expanded row content
  const renderExpandedContent = (qcRibbon: QcRibbon) => {
    if (
      !qcRibbon.qc_ribbon_details ||
      qcRibbon.qc_ribbon_details.length === 0
    ) {
      return null;
    }

    return (
      <div className="p-4 bg-muted/30">
        <h4 className="text-sm font-semibold mb-3">QC Ribbon Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qcRibbon.qc_ribbon_details.map((detail) => (
            <div
              key={detail.id}
              className="border rounded-lg p-3 bg-background"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium">
                  Box: {detail.box.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  #{detail.box.code}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Quantity:{" "}
                <span className=" font-medium">{detail.quantity}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Added:{" "}
                {format(new Date(detail.created_at), "dd MMM yyyy HH:mm")}
              </div>
            </div>
          ))}
        </div>
        {qcRibbon.qc_ribbon_details.length > 0 && (
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            Total items:{" "}
            {qcRibbon.qc_ribbon_details.reduce(
              (sum, detail) => sum + detail.quantity,
              0
            )}{" "}
            in {qcRibbon.qc_ribbon_details.length} box
            {qcRibbon.qc_ribbon_details.length === 1 ? "" : "es"}
          </div>
        )}
      </div>
    );
  };

  const columns: ColumnDef<QcRibbon>[] = [
    {
      id: "expand",
      enableHiding: false,
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const qcRibbon = row.original;
        const hasDetails =
          qcRibbon.qc_ribbon_details && qcRibbon.qc_ribbon_details.length > 0;
        const isExpanded = expandedRows.has(qcRibbon.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={() => toggleRowExpansion(qcRibbon.id)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: () => <div className="text-sm text-center font-semibold">ID</div>,
      cell: ({ row }) => (
        <div className=" text-sm text-center">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">Tracking</div>
      ),
      cell: ({ row }) => (
        <div className=" text-sm text-center">{row.getValue("tracking")}</div>
      ),
    },
    {
      accessorKey: "order",
      header: () => (
        <div className="text-sm text-center font-semibold">Order Info</div>
      ),
      cell: ({ row }) => {
        const order = row.original.order;
        return (
          <div className="text-sm text-center">
            {order ? (
              <div className="space-y-1">
                <div className=" text-xs">{order.order_ginee_id}</div>
                <Badge className="bg-green-500 text-white hover:bg-green-600 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                  {order.processing_status}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {order.store}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No order</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "qc_by",
      header: () => (
        <div className="text-sm text-center font-semibold">QC Operator</div>
      ),
      cell: ({ row }) => {
        const qcOperator = row.original.qc_operator;
        return (
          <div className="text-sm text-center">
            {qcOperator ? (
              <div>
                <div className="font-medium">{qcOperator.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  @{qcOperator.username}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No QC Operator</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "complained",
      header: () => (
        <div className="text-sm text-center font-semibold">Complained</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              row.getValue("complained")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {row.getValue("complained") ? "Yes" : "No"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: () => (
        <div className="text-sm text-center font-semibold">Created</div>
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
      accessorKey: "updated_at",
      header: () => <div className="text-sm font-semibold">Updated</div>,
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
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 flex flex-col border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Search Order</h3>
          <Separator className="mt-0 mb-6" />
          <QcRibbonTrackingSearch onOrderFound={handleOrderFound} />
        </div>

        <div className="col-span-2 flex flex-col rounded-md">
          <QcOperatorPerformance qcRibbons={data} />
        </div>
      </div>

      <Separator className="mt-0" />
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex justify-start items-center gap-2">
          {/* Filters */}
          <div className="flex justify-start items-center gap-2">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2 items-center"
            >
              <Input
                placeholder="Search qc-ribbons..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
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

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary tracking-wider border-primary border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-2 text-primary-foreground font-bold"
                  >
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
                    Loading qc-ribbons...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const qcRibbon = row.original;
                const isExpanded = expandedRows.has(qcRibbon.id);

                return (
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
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          {renderExpandedContent(qcRibbon)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No qc-ribbons found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between gap-2 items-center">
        <div className="flex justify-start gap-2 items-center">
          {/* Pagination limit */}
          <PaginationLimit
            value={pagination.limit}
            onValueChange={handleLimitChange}
          />

          {/* Pagination Status */}
          <PaginationStatus
            currentPage={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            itemName="qc-ribbons"
          />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      {/* QC Ribbon Dialog */}
      <QcRibbonCreateDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        order={selectedOrder}
        onSuccess={handleQcRibbonCreated}
      />
    </div>
  );
}
