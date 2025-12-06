"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { QcOnlineForm } from "@/components/forms/qc-online-form";
import type { Order } from "@/types/order";
import { orderApi } from "@/lib/api/orderApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface QcOnlineCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSuccess?: () => void;
}

export function QcOnlineCreateDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: QcOnlineCreateDialogProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Update order status to qc-process when dialog opens
  useEffect(() => {
    if (open && order) {
      const updateToQcProcess = async () => {
        try {
          setUpdatingStatus(true);
          await orderApi.updateOrderToQcProcess(order.id);
        } catch (error) {
          console.error("Error updating order status to qc-process:", error);
          toast.error("Failed to update order status");
        } finally {
          setUpdatingStatus(false);
        }
      };
      updateToQcProcess();
    }
  }, [open, order]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      await orderApi.updateOrderToPickingCompleted(order.id);
      toast.success("Order status reverted to picking completed");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order status to picking-completed:", error);
      toast.error("Failed to revert order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogTitle />
      <DialogContent
        className="min-w-[950px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {updatingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <QcOnlineForm
            order={order}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
