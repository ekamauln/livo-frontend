"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Loader2, XCircle } from "lucide-react";
import { orderApi } from "@/lib/api/orderApi";
import type { Order, OrderDetail } from "@/types/order";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderDialogProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "details" | "pending";
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
  const [pendingConfirming, setPendingConfirming] = useState(false);

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

  // Pending order
  const handlePendingOrder = async () => {
    if (!orderId) return;

    try {
      setUpdating(true);
      setPendingConfirming(false);

      await orderApi.pendingAssignedOrder(orderId);

      toast.success("Order set to pending successfully");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error setting order to pending:", error);
      toast.error("Failed to set order to pending", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
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
    }
  }, [open, orderId, initialTab, fetchOrderDetails]);

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
            {orderId
              ? "View order details and manage pending status"
              : "No order selected"}
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
                setActiveTab(value as "details" | "pending")
              }
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 shrink-0">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Details ({orderDetails.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Pending Picking</span>
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
                                        <TableHead className="text-center max-w-[100px]">
                                          SKU
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Quantity
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Variant
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Price
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell className="min-w-[100px] max-w-[150px] truncate">
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
                                        <TableCell className="text-center">
                                          {detail.price.toLocaleString() || 0}
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

                  {/* Pending Order Tab */}
                  <TabsContent value="pending" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-yellow-600" />
                            <span className="text-yellow-600">
                              Pending Order
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
                                  Pending this order will permanently change
                                  status of the order. The old order will be on
                                  pending picking status.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Confirmation Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="pending-confirm"
                                checked={pendingConfirming}
                                onChange={(e) =>
                                  setPendingConfirming(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                              />
                              <label
                                htmlFor="pending-confirm"
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
                                  setPendingConfirming(false);
                                  setActiveTab("details");
                                }}
                                className="cursor-pointer"
                              >
                                Go Back
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                onClick={handlePendingOrder}
                                disabled={!pendingConfirming || updating}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-yellow-600 text-white hover:bg-yellow-700"
                              >
                                {updating && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <XCircle className="mr-2 h-4 w-4" />
                                Pending Order
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
