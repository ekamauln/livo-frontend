"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { orderApi } from "@/lib/api/orderApi";
import type { Order } from "@/types/order";

// Schema for tracking search
const trackingSearchSchema = z.object({
  tracking: z.string().min(1, "Tracking number is required"),
});

type TrackingSearchData = z.infer<typeof trackingSearchSchema>;

interface QcOnlineTrackingSearchProps {
  onOrderFound: (order: Order) => void;
}

export function QcOnlineTrackingSearch({
  onOrderFound,
}: QcOnlineTrackingSearchProps) {
  const [searchingOrder, setSearchingOrder] = useState(false);

  // Form for tracking search
  const trackingForm = useForm<TrackingSearchData>({
    resolver: zodResolver(trackingSearchSchema),
    defaultValues: {
      tracking: "",
    },
  });

  // Search order by tracking
  const handleSearchTracking = async (data: TrackingSearchData) => {
    try {
      setSearchingOrder(true);
      const response = await orderApi.getOrders(1, 10, data.tracking);

      const orders = response.data.orders as Order[];

      if (!orders || orders.length === 0) {
        toast.error("Order not found", {
          description: `No order found with tracking: ${data.tracking}`,
        });
        return;
      }

      const order = orders[0];

      // Validate processing status
      if (order.processing_status.toLowerCase() !== "picking completed") {
        toast.error("Invalid order status", {
          description: `Order status must be "picking completed". Current status: ${order.processing_status}`,
        });
        return;
      }

      toast.success("Order found!", {
        description: "Opening verification dialog...",
      });

      trackingForm.reset();
      onOrderFound(order);
    } catch (error) {
      console.error("Error searching order:", error);
      toast.error("Failed to search order", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setSearchingOrder(false);
    }
  };

  return (
    <Form {...trackingForm}>
      <form
        onSubmit={trackingForm.handleSubmit(handleSearchTracking)}
        className="space-y-4"
      >
        <FormField
          control={trackingForm.control}
          name="tracking"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tracking Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter tracking number"
                  {...field}
                  disabled={searchingOrder}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={searchingOrder} className="w-full">
          {searchingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Search className="mr-2 h-4 w-4" />
          Search Order
        </Button>
      </form>
    </Form>
  );
}
