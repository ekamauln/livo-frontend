"use client";

import React, { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
  XCircle,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderApi } from "@/lib/api/orderApi";
import { productApi } from "@/lib/api/productApi";
import type { Order, OrderDetail } from "@/types/order";
import type { Product } from "@/types/product";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form schemas
const orderDetailSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  sku: z.string().min(1, "SKU is required"),
  variant: z.string().optional(),
});

type OrderDetailFormData = z.infer<typeof orderDetailSchema>;

interface OrderDialogProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "details" | "edit" | "add" | "duplicate" | "cancel";
  onOrderUpdate?: () => void;
}

const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "ready to pick":
      return "bg-green-500 text-white hover:bg-green-600";
    case "picking process":
      return "bg-blue-500 text-white hover:bg-blue-600";
    case "picking complete":
      return "bg-red-500 text-white hover:bg-red-600";
    default:
      return "bg-gray-500 text-white hover:bg-gray-600";
  }
};

export function OrderDialog({
  orderId,
  open,
  onOpenChange,
  initialTab = "details",
  onOrderUpdate,
}: OrderDialogProps) {
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderIdString, setOrderIdString] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [duplicateConfirming, setDuplicateConfirming] = useState(false);

  // Delete confirmation states
  const [deleteConfirmingId, setDeleteConfirmingId] = useState<number | null>(
    null
  );

  // Product search states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Check if operations are allowed based on order status
  const isOperationAllowed = () => {
    return orderStatus.toLowerCase() !== "picking process" || "qc process";
  };

  // Show error message for forbidden operations
  const showForbiddenOperationError = () => {
    toast.error("Operation not allowed", {
      description: `Order modifications are only allowed when status is not "picking process" or "qc process". Current status: "${orderStatus}"`,
    });
  };

  // Form for adding/editing order details
  const form = useForm<OrderDetailFormData>({
    resolver: zodResolver(orderDetailSchema),
    defaultValues: {
      product_name: "",
      quantity: 1,
      sku: "",
      variant: "",
    },
  });

  // Fetch order details
  const fetchOrderDetails = useCallback(async (id: number) => {
    try {
      setLoading(true);

      // Fetch order with details
      const response = await orderApi.getOrderById(id);
      const order = response.data;

      setOrderData(order);
      setOrderStatus(order.processing_status);
      setOrderIdString(order.order_ginee_id);
      setOrderDetails(order.order_details || []);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order details", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setProductsLoading(true);
      const response = await productApi.getProducts(1, 20, query);
      setProducts(response.data.products as Product[]);
    } catch (error) {
      console.error("Error searching products:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearch, searchProducts]);

  // Add new order detail
  const addOrderDetail = async (data: OrderDetailFormData) => {
    if (!orderId || !orderData) return;

    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    try {
      setUpdating(true);

      // Add new detail to existing order_details array
      const updatedOrderDetails = [
        ...orderDetails,
        {
          sku: data.sku,
          product_name: data.product_name,
          variant: data.variant || "-",
          quantity: data.quantity,
        },
      ];

      // Update order with complete data
      await orderApi.updateOrder(orderId, {
        channel: orderData.channel,
        store: orderData.store,
        buyer: orderData.buyer,
        address: orderData.address,
        courier: orderData.courier,
        tracking: orderData.tracking,
        sent_before: orderData.sent_before,
        event_status: "data changed",
        order_details: updatedOrderDetails,
      });

      toast.success("Order detail added successfully");
      form.reset();
      setActiveTab("details");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error adding order detail:", error);
      toast.error("Failed to add order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Edit order detail
  const editOrderDetail = async (
    detailId: number,
    data: OrderDetailFormData
  ) => {
    if (!orderId || !orderData) return;

    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    try {
      setUpdating(true);

      // Update the specific detail in the array
      const updatedOrderDetails = orderDetails.map((detail) =>
        detail.id === detailId
          ? {
              id: detail.id,
              sku: data.sku,
              product_name: data.product_name,
              variant: data.variant || "-",
              quantity: data.quantity,
            }
          : {
              id: detail.id,
              sku: detail.sku,
              product_name: detail.product_name,
              variant: detail.variant || "-",
              quantity: detail.quantity,
            }
      );

      // Update order with complete data
      await orderApi.updateOrder(orderId, {
        channel: orderData.channel,
        store: orderData.store,
        buyer: orderData.buyer,
        address: orderData.address,
        courier: orderData.courier,
        tracking: orderData.tracking,
        sent_before: orderData.sent_before,
        event_status: "data changed",
        order_details: updatedOrderDetails,
      });

      toast.success("Order detail updated successfully");
      form.reset();
      setEditingDetailId(null);
      setActiveTab("details");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error updating order detail:", error);
      toast.error("Failed to update order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete button click (first click shows confirmation)
  const handleDeleteClick = (detailId: number) => {
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    if (deleteConfirmingId === detailId) {
      // Second click - actually delete
      deleteOrderDetail(detailId);
    } else {
      // First click - show confirmation
      setDeleteConfirmingId(detailId);
      toast.info("Click delete again to confirm", {
        description: "This action cannot be undone",
      });

      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setDeleteConfirmingId(null);
      }, 3000);
    }
  };

  // Delete order detail
  const deleteOrderDetail = async (detailId: number) => {
    if (!orderId || !orderData) return;

    try {
      setUpdating(true);
      setDeleteConfirmingId(null); // Reset confirmation state

      // Remove the detail from the array
      const updatedOrderDetails = orderDetails
        .filter((detail) => detail.id !== detailId)
        .map((detail) => ({
          id: detail.id,
          sku: detail.sku,
          product_name: detail.product_name,
          variant: detail.variant || "-",
          quantity: detail.quantity,
        }));

      // Update order with complete data
      await orderApi.updateOrder(orderId, {
        channel: orderData.channel,
        store: orderData.store,
        buyer: orderData.buyer,
        address: orderData.address,
        courier: orderData.courier,
        tracking: orderData.tracking,
        sent_before: orderData.sent_before,
        event_status: "data changed",
        order_details: updatedOrderDetails,
      });

      toast.success("Order detail deleted successfully");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error deleting order detail:", error);
      toast.error("Failed to delete order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Duplicate order
  const handleDuplicateOrder = async () => {
    if (!orderId) return;

    try {
      setUpdating(true);
      setDuplicateConfirming(false);

      await orderApi.duplicateOrder(orderId);

      toast.success("Order duplicated successfully");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
      setActiveTab("details");
    } catch (error) {
      console.error("Error duplicating order:", error);
      toast.error("Failed to duplicate order", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!orderId) return;

    try {
      setUpdating(true);
      setCancelConfirming(false);

      await orderApi.cancelOrder(orderId);

      toast.success("Order cancelled successfully");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
      setActiveTab("details");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    form.setValue("product_name", product.name);
    form.setValue("sku", product.sku);
    if (product.variant) {
      form.setValue("variant", product.variant);
    }
    setProductSearchOpen(false);
    setProductSearch("");
  };

  // Handle edit detail
  const handleEditDetail = (detail: OrderDetail) => {
    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    if (!detail.id) {
      toast.error("Cannot edit detail without ID");
      return;
    }

    form.reset({
      product_name: detail.product_name,
      quantity: detail.quantity || 1,
      sku: detail.sku || "",
      variant: detail.variant || "",
    });
    setEditingDetailId(detail.id);
    setActiveTab("edit");
  };

  // Form submit handler
  const onSubmit = (data: OrderDetailFormData) => {
    if (editingDetailId) {
      editOrderDetail(editingDetailId, data);
    } else {
      addOrderDetail(data);
    }
  };

  // Effects
  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails(orderId);
      setActiveTab(initialTab);
    } else {
      setOrderData(null);
      setOrderDetails([]);
      setOrderStatus("");
      setOrderIdString("");
      setEditingDetailId(null);
      setDeleteConfirmingId(null);
      setCancelConfirming(false);
      form.reset();
      setProducts([]);
      setProductSearch("");
    }
  }, [open, orderId, initialTab, fetchOrderDetails, form]);

  const isEditing = editingDetailId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : orderId
              ? `Order Details - Order ID: ${orderIdString || orderId}`
              : "Order Details"}
            {orderStatus && (
              <Badge
                variant="default"
                className={getStatusBadgeStyle(orderStatus)}
              >
                {orderStatus}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {orderId ? (
              <>
                View and manage order details
                {orderStatus &&
                  orderStatus.toLowerCase() !== "ready to pick" && (
                    <span className="text-orange-600 dark:text-orange-400 text-sm block mt-2">
                      ⚠️ Modifications are only allowed when order status is not
                      &quot;picking process&quot; or &quot;qc process&quot;
                    </span>
                  )}
              </>
            ) : (
              "No order selected"
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading order details...
          </div>
        ) : orderId ? (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(
                  value as "details" | "edit" | "add" | "duplicate" | "cancel"
                )
              }
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-5 shrink-0">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Details ({orderDetails.length})
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Detail
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  {isEditing ? "Edit Detail" : "Edit Mode"}
                </TabsTrigger>
                <TabsTrigger
                  value="duplicate"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Duplicate Order</span>
                </TabsTrigger>
                <TabsTrigger value="cancel" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Cancel Order</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 mt-4">
                <div className="flex-1 overflow-y-auto">
                  {/* Details Tab */}
                  <TabsContent value="details" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <div className="space-y-4">
                        {orderDetails.length > 0 ? (
                          orderDetails.map((detail) => (
                            <Card key={detail.id} className="w-full">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm max-w-[680px] text-wrap">
                                    {detail.product_name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleEditDetail(detail)}
                                      disabled={!isOperationAllowed()}
                                      className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant={
                                        deleteConfirmingId === detail.id
                                          ? "destructive"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        detail.id &&
                                        handleDeleteClick(detail.id)
                                      }
                                      disabled={
                                        updating || !isOperationAllowed()
                                      }
                                      className={cn(
                                        "h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                                        deleteConfirmingId === detail.id &&
                                          "animate-pulse border-red-500 bg-red-500 text-white"
                                      )}
                                      title={
                                        deleteConfirmingId === detail.id
                                          ? "Click again to confirm delete"
                                          : "Delete order detail"
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Separator
                                  orientation="horizontal"
                                  className="mt-2 data-[orientation=horizontal]"
                                />
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-center font-mono max-w-[100px]">
                                          SKU
                                        </TableHead>
                                        <TableHead className="text-center font-mono">
                                          Quantity
                                        </TableHead>
                                        <TableHead className="text-center font-mono">
                                          Variant
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell className="font-mono min-w-[150px] max-w-[150px] truncate">
                                          {detail.sku || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="outline">
                                            {detail.quantity}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {detail.variant || "N/A"}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No order details found.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Add Detail Tab */}
                  <TabsContent value="add" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add New Order Detail
                          </CardTitle>
                          <Separator
                            orientation="horizontal"
                            className="mt-2 data-[orientation=horizontal]"
                          />
                        </CardHeader>
                        <CardContent>
                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit(onSubmit)}
                              className="space-y-6"
                            >
                              {/* Product Search */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Search Products
                                </label>
                                <Popover
                                  open={productSearchOpen}
                                  onOpenChange={setProductSearchOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={productSearchOpen}
                                      className="w-full justify-between"
                                    >
                                      <div className="flex items-center">
                                        <Search className="mr-2 h-4 w-4" />
                                        Search products to auto-fill details...
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onValueChange={setProductSearch}
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {productsLoading
                                            ? "Searching..."
                                            : "No products found."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {products.map((product) => (
                                            <CommandItem
                                              key={product.id}
                                              value={`${product.sku}-${product.name}`}
                                              onSelect={() =>
                                                handleProductSelect(product)
                                              }
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span>SKU: {product.sku}</span>
                                                <span className="text-xs truncate">
                                                  {product.name}
                                                </span>
                                                {product.variant && (
                                                  <span className="text-xs">
                                                    Variant: {product.variant}
                                                  </span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="sku"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>SKU</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter SKU"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="product_name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Product Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter product name"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="quantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="Enter quantity"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="variant"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Variant (Optional)</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g., Red - Size M"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => form.reset()}
                                  className="cursor-pointer"
                                >
                                  Reset Form
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={updating || !isOperationAllowed()}
                                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updating && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Add Detail
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Edit Detail Tab */}
                  <TabsContent value="edit" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      {isEditing ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Edit className="h-5 w-5" />
                              Edit Order Detail
                            </CardTitle>
                            <Separator
                              orientation="horizontal"
                              className="mt-2 data-[orientation=horizontal]"
                            />
                          </CardHeader>
                          <CardContent>
                            <Form {...form}>
                              <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="product_name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter product name"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter SKU"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="1"
                                            placeholder="Enter quantity"
                                            {...field}
                                            onChange={(e) =>
                                              field.onChange(
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="variant"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Variant (Optional)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="e.g., Red - Size M"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      form.reset();
                                      setEditingDetailId(null);
                                      setActiveTab("details");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={updating || !isOperationAllowed()}
                                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {updating && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Update Detail
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Select an order detail to edit from the Details tab.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Duplicate Order Tab */}
                  <TabsContent value="duplicate" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-yellow-600" />
                            <span className="text-yellow-600">
                              Duplicate Order
                            </span>
                          </CardTitle>
                          <Separator
                            orientation="horizontal"
                            className="mt-2 data-[orientation=horizontal]"
                          />
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Order Information */}
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Order ID:
                              </span>
                              <span className="text-sm">
                                {orderIdString || orderId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Status:
                              </span>
                              <Badge
                                className={getStatusBadgeStyle(orderStatus)}
                              >
                                {orderStatus}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Store:
                              </span>
                              <span className="text-sm">
                                {orderData?.store || "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Buyer:
                              </span>
                              <span className="text-sm">
                                {orderData?.buyer || "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Total Items:
                              </span>
                              <span className="text-sm">
                                {orderDetails.length}
                              </span>
                            </div>
                          </div>

                          {/* Warning Message */}
                          <div className="bg-yellow-50 dark:bg-red-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex gap-3">
                              <XCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h4 className="font-semibold text-yellow-900 dark:text-red-100">
                                  Warning: This action cannot be undone
                                </h4>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  Duplicating this order will permanently change
                                  tracking and order details and duplicating to
                                  new order. The old order will no longer be
                                  available for processing or modification.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Confirmation Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="duplicate-confirm"
                                checked={duplicateConfirming}
                                onChange={(e) =>
                                  setDuplicateConfirming(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                              />
                              <label
                                htmlFor="duplicate-confirm"
                                className="text-sm font-medium cursor-pointer"
                              >
                                I understand this action cannot be undone
                              </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setCancelConfirming(false);
                                  setActiveTab("details");
                                }}
                                className="cursor-pointer"
                              >
                                Go Back
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                onClick={handleDuplicateOrder}
                                disabled={!duplicateConfirming || updating}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-yellow-600 text-white hover:bg-yellow-700"
                              >
                                {updating && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <XCircle className="mr-2 h-4 w-4" />
                                Duplicate Order
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Cancel Order Tab */}
                  <TabsContent value="cancel" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="text-destructive">
                              Cancel Order
                            </span>
                          </CardTitle>
                          <Separator
                            orientation="horizontal"
                            className="mt-2 data-[orientation=horizontal]"
                          />
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Order Information */}
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Order ID:
                              </span>
                              <span className="text-sm">
                                {orderIdString || orderId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Status:
                              </span>
                              <Badge
                                className={getStatusBadgeStyle(orderStatus)}
                              >
                                {orderStatus}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Store:
                              </span>
                              <span className="text-sm">
                                {orderData?.store || "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Buyer:
                              </span>
                              <span className="text-sm">
                                {orderData?.buyer || "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Total Items:
                              </span>
                              <span className="text-sm">
                                {orderDetails.length}
                              </span>
                            </div>
                          </div>

                          {/* Warning Message */}
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex gap-3">
                              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h4 className="font-semibold text-red-900 dark:text-red-100">
                                  Warning: This action cannot be undone
                                </h4>
                                <p className="text-sm text-red-800 dark:text-red-200">
                                  Cancelling this order will permanently mark it
                                  as cancelled. The order will no longer be
                                  available for processing or modification.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Confirmation Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="cancel-confirm"
                                checked={cancelConfirming}
                                onChange={(e) =>
                                  setCancelConfirming(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                              />
                              <label
                                htmlFor="cancel-confirm"
                                className="text-sm font-medium cursor-pointer"
                              >
                                I understand this action cannot be undone
                              </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setCancelConfirming(false);
                                  setActiveTab("details");
                                }}
                                className="cursor-pointer"
                              >
                                Go Back
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleCancelOrder}
                                disabled={!cancelConfirming || updating}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updating && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No order selected.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
