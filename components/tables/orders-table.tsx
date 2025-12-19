"use client";

import React from "react";
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
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Truck,
  MoreHorizontal,
  Eye,
  Edit,
  XCircle,
  Copy,
} from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Order, OrdersQueryParams } from "@/types/order";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { orderApi } from "@/lib/api/orderApi";
import { OrderDialog } from "@/components/dialogs/order-dialog";
import { PaginationLimit } from "@/components/custom-ui/pagination-limit";
import { Pagination } from "@/components/custom-ui/pagination";
import { PaginationStatus } from "@/components/custom-ui/pagination-status";

// Local type for pagination state
type Pagination = { page: number; limit: number; total: number };

// Status badge color mapping
const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "ready to pick":
      return "bg-green-500 text-white hover:bg-green-600";
    case "picking process":
      return "bg-blue-500 text-white hover:bg-blue-600";
    case "picking completed":
      return "bg-violet-500 text-white hover:bg-violet-600";
    case "pending picking":
      return "bg-orange-500 text-white hover:bg-orange-600";
    case "qc process":
      return "bg-cyan-500 text-white hover:bg-cyan-600";
    case "qc completed":
      return "bg-emerald-500 text-white hover:bg-emerald-600";
    case "outbound completed":
      return "bg-teal-500 text-white hover:bg-teal-600";

    default:
      return "bg-gray-500 text-white hover:bg-gray-600";
  }
};

// Helper function to format date at safely
const formatDateAt = (
  pickedAt?: string,
  pendingAt?: string,
  changedAt?: string,
  cancelledAt?: string,
  assignedAt?: string
): string => {
  if (
    pickedAt === "-" ||
    pendingAt === "-" ||
    changedAt === "-" ||
    cancelledAt === "-" ||
    assignedAt === "-"
  ) {
    return "-";
  }

  try {
    const date = new Date(
      pickedAt || pendingAt || changedAt || cancelledAt || assignedAt || ""
    );
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    return format(date, "dd MMM yyyy - HH:mm:ss");
  } catch {
    return "-";
  }
};

// Render expanded row content
const renderExpandedContent = (order: Order) => {
  if (!order.order_details || order.order_details.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-muted/30">
      <h4 className="text-sm font-semibold mb-3">Order Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {order.order_details.map((detail, index) => (
          <div
            key={detail.id || index}
            className="border rounded-lg p-4 bg-background"
          >
            <div className="flex gap-4">
              {/* Product Image */}
              {detail.product?.image && (
                <div className="shrink-0">
                  <Image
                    src={detail.product.image}
                    alt={detail.product_name || "Product"}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-md border"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                </div>
              )}

              {/* Product Details */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start space-y-2">
                  <div>
                    <div className="font-medium text-sm text-wrap max-w-md">
                      {detail.product_name}
                    </div>

                    {detail.variant &&
                      detail.variant !== "-" &&
                      detail.variant !== "" && (
                        <div className="text-xs text-muted-foreground  mt-1">
                          Variant: {detail.variant}
                        </div>
                      )}

                    {detail.product?.location &&
                      detail.product.location !== "" && (
                        <div className="text-xs text-muted-foreground  mt-1">
                          Location: {detail.product.location}
                        </div>
                      )}

                    {detail.sku && (
                      <div className="text-xs text-muted-foreground  mt-1">
                        SKU: {detail.sku}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground  mt-1">
                      Price: {detail.price?.toLocaleString()}
                    </div>
                  </div>
                  {detail.quantity && detail.quantity !== 0 && (
                    <Badge className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ml-2">
                      Qty: {detail.quantity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>{" "}
      {/* Summary */}
      {order.order_details.length > 0 && (
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          Total items:{" "}
          {order.order_details.reduce(
            (sum, detail) => sum + (detail.quantity || 0),
            0
          )}{" "}
          in {order.order_details.length} product
          {order.order_details.length === 1 ? "" : "s"}
        </div>
      )}
      {/* Picked Information - Always show */}
      <div className="mt-3 pt-3 border-t">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border rounded-md">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-10">
                    Assigned By
                  </TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{order.assigned_by}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Picked By</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{order.picked_by}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Changed By</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{order.changed_by}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Pending By</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{order.pending_by}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">
                    Cancelled By
                  </TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{order.cancelled_by}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-10">
                    Assigned At
                  </TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{formatDateAt(order.assigned_at)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Picked At</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{formatDateAt(order.picked_at)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Changed At</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{formatDateAt(order.changed_at)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">Pending At</TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{formatDateAt(order.pending_at)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium w-10">
                    Cancelled At
                  </TableCell>
                  <TableCell className="font-medium w-2">:</TableCell>
                  <TableCell>{formatDateAt(order.cancelled_at)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrdersTable() {
  const [data, setData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    event_status: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(), // Today
  });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDialogTab, setOrderDialogTab] = useState<
    "details" | "edit" | "add" | "duplicate" | "cancel"
  >("details");

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

  // Order dialog handlers
  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("details");
    setOrderDialogOpen(true);
  };

  const handleAddDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("add");
    setOrderDialogOpen(true);
  };

  const handleDuplicateOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("duplicate");
    setOrderDialogOpen(true);
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("cancel");
    setOrderDialogOpen(true);
  };

  const handleOrderUpdate = () => {
    // Refresh the orders table when order is updated
    const params: OrdersQueryParams = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  // Fetch orders data
  const fetchOrders = useCallback(
    async (params: OrdersQueryParams = {}, search: string = "") => {
      try {
        setIsLoading(true);

        const response = await orderApi.getOrders(
          params.page || 1,
          params.limit || 10,
          search.trim() || undefined,
          params.start_date,
          params.end_date
        );

        // The response.data contains orders and pagination from PaginatedResponse
        setData(response.data.orders as Order[]);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        setData([]);
        setPagination((prev: Pagination) => ({ ...prev, total: 0 }));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));

    const params: OrdersQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  // Initial load and date range changes
  useEffect(() => {
    const params: OrdersQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));
    setSearchQuery(""); // Reset search query on date/limit changes
    fetchOrders(params, ""); // Reset search on date/limit changes
  }, [dateRange, pagination.limit, fetchOrders]);

  // Table columns definition
  const columns: ColumnDef<Order>[] = [
    {
      id: "expand",
      enableHiding: false,
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const order = row.original;
        const details = order.order_details || [];
        const hasDetails = details.length > 0;
        const isExpanded = expandedRows.has(order.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={() => toggleRowExpansion(order.id)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "order_ginee_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Order ID</div>
      ),
      cell: ({ row }) => (
        <div className=" text-sm text-center">
          {row.getValue("order_ginee_id")}
        </div>
      ),
    },
    {
      accessorKey: "processing_status",
      header: () => (
        <div>
          <div className="text-sm text-center font-semibold">Processing</div>
          <div className="text-sm text-center font-semibold">Status</div>
        </div>
      ),
      cell: ({ row }) => {
        const eventStatus = row.original.event_status?.toLowerCase();
        const isCancelled = eventStatus === "cancelled";
        const isOldDuplicated = eventStatus === "old duplicated";
        const processingStatus = row.getValue("processing_status") as string;
        const displayStatus = isCancelled
          ? "cancelled"
          : isOldDuplicated
          ? "old duplicated"
          : processingStatus;

        return (
          <div className="flex justify-center items-center flex-wrap text-center text-xs">
            <Badge
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                isCancelled
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : isOldDuplicated
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : getStatusBadgeStyle(processingStatus)
              }`}
            >
              {displayStatus}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "event_status",
      header: () => (
        <div>
          <div className="text-sm text-center font-semibold">Event</div>
          <div className="text-sm text-center font-semibold">Status</div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-xs text-center">
          {row.getValue("event_status") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "channel",
      header: () => (
        <div className="text-sm text-center font-semibold">Channel</div>
      ),
      cell: ({ row }) => (
        <div className="max-w-32 truncate text-sm text-center">
          {row.getValue("channel") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "store",
      header: () => (
        <div className="text-sm text-center font-semibold">Store</div>
      ),
      cell: ({ row }) => (
        <div className="max-w-32 truncate text-sm text-center">
          {row.getValue("store") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "courier",
      header: () => (
        <div className="text-sm text-center font-semibold">Courier</div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center text-sm text-center justify-center">
          <Truck className="h-4 w-4 text-muted-foreground mr-1" />
          <div>{row.getValue("courier") || "N/A"}</div>
        </div>
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
      accessorKey: "sent_before",
      header: () => (
        <div className="text-sm text-center font-semibold">Sent Before</div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("sent_before"));
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
      header: () => (
        <div className="text-sm text-center font-semibold">Updated</div>
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
      id: "items_count",
      header: () => (
        <div>
          <div className="text-sm text-center font-semibold">Total</div>
          <div className="text-sm text-center font-semibold">Items</div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center text-xs">
          <Badge variant="outline">{row.original.order_details.length}</Badge>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" forceMount>
                <DropdownMenuItem
                  onClick={() => handleViewDetails(order.id)}
                  className="cursor-pointer"
                >
                  <Eye
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAddDetails(order.id)}
                  className="cursor-pointer"
                >
                  <Edit
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  Add Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDuplicateOrder(order.id)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Duplicate Order</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCancelOrder(order.id)}
                  className="cursor-pointer"
                >
                  <XCircle className="mr-2 h-4 w-4 text-destructive" />
                  <span className="text-destructive">Cancel Order</span>
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
    manualPagination: true, // Since we're handling pagination server-side
    manualFiltering: true, // Since we're handling search server-side
  });

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination((prev: Pagination) => ({ ...prev, page: newPage }));

    const params: OrdersQueryParams = {
      page: newPage,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev: Pagination) => ({
      ...prev,
      limit: newLimitValue,
      page: 1,
    }));

    const params: OrdersQueryParams = {
      page: 1,
      limit: newLimitValue,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex justify-start gap-2 items-center">
          {/* Filters */}
          <div className="flex justify-start gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
          <div className="flex justify-start gap-2 items-center">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-auto"
            />
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
                    Loading returns...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const order = row.original;
                const isExpanded = expandedRows.has(order.id);

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
                          {renderExpandedContent(order)}
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
                  No returns found.
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
            itemName="boxes"
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

      {/* Order Dialog */}
      <OrderDialog
        orderId={selectedOrderId}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        initialTab={orderDialogTab}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
}
