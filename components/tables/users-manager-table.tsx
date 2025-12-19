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
  MoreHorizontal,
  Eye,
  Edit,
  KeyRound,
  BookUser,
  Zap,
  ZapOff,
  UserPlus,
} from "lucide-react";
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
import { User, Role } from "@/types/auth";
import { userManagerApi } from "@/lib/api/userManagerApi";
import { UserCreateDialog } from "@/components/dialogs/user-manager-create-dialog";
import { UserDialog } from "@/components/dialogs/user-manager-dialog";
import React from "react";
import { getRoleBadgeStyle } from "@/components/custom-ui/role-badge-style";
import { PaginationLimit } from "@/components/custom-ui/pagination-limit";
import { Pagination } from "@/components/custom-ui/pagination";
import { PaginationStatus } from "@/components/custom-ui/pagination-status";

export default function UsersManagerTable() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Dialog State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<
    "detail" | "profile" | "password" | "status" | "role"
  >("detail");

  // Fetch users data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await userManagerApi.getUsers(
          page,
          pagination.limit,
          search
        );
        // Extract users array from the response data
        const users = response.data.users as User[];
        setData(users);
        setPagination(response.data.pagination);
      } catch {
        toast.error("Failed to fetch users. Please try again.");
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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: () => (
        <div className="text-sm text-center font-semibold">Username</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: () => (
        <div className="text-sm text-center font-semibold">Email</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "full_name",
      header: () => (
        <div className="text-sm text-center font-semibold">Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("full_name")}</div>
      ),
    },
    {
      accessorKey: "is_active",
      header: () => (
        <div className="text-sm text-center font-semibold">Status</div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.getValue("is_active") ? (
            <Zap className="w-4 h-4 text-primary" />
          ) : (
            <ZapOff className="w-4 h-4 text-destructive" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "roles",
      header: () => <div className="text-center font-semibold">Roles</div>,
      cell: ({ row }) => {
        const roles = row.getValue("roles") as Role[];
        return (
          <div className="flex gap-1 flex-wrap text-wrap justify-center">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getRoleBadgeStyle(
                  role.name
                )}`}
              >
                {role.name}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: () => <div className="text-center font-semibold">Created</div>,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground text-center">
          {format(new Date(row.getValue("created_at")), "dd MMM yyyy")}
          <br />
          {format(new Date(row.getValue("created_at")), "HH:mm:ss")}
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.getValue("updated_at")), "dd MMM yyyy")}
          <br />
          {format(new Date(row.getValue("updated_at")), "HH:mm:ss")}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("detail");
                    setUserDialogOpen(true);
                  }}
                >
                  <Eye
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("profile");
                    setUserDialogOpen(true);
                  }}
                >
                  <Edit
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("password");
                    setUserDialogOpen(true);
                  }}
                >
                  <KeyRound
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  Password Change
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("status");
                    setUserDialogOpen(true);
                  }}
                >
                  <Zap
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  Status Change
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("role");
                    setUserDialogOpen(true);
                  }}
                >
                  <BookUser
                    size="16"
                    className="mr-2 hover:text-primary-foreground"
                  />
                  Manage Roles
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
        </div>

        <div className="flex justify-start items-center gap-2">
          {/* Create New User Button */}
          <div className="flex justify-start items-center gap-2">
            <Button
              variant="default"
              className="cursor-pointer rounded-md"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="flex items-center gap-2 justify-center">
                <UserPlus className="w-4 h-4" /> <span>Create New User</span>
              </div>
            </Button>
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
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary tracking-wider border-primary border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-2 text-primary-foreground font-bold "
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
                    Loading users...
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
                  No users found.
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
            itemName="users"
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

      {/* User Dialog */}
      <UserDialog
        userId={selectedUserId}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        initialTab={dialogTab}
        onUserUpdate={() => {
          // Refresh the data to show any updates
          fetchData(pagination.page, searchQuery);
        }}
      />

      {/* Create User Dialog */}
      <UserCreateDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={(user) => {
          // Refresh the data to show the new user
          fetchData(pagination.page, searchQuery);
          toast.success(`User ${user.username} created successfully!`);
        }}
      />
    </div>
  );
}
