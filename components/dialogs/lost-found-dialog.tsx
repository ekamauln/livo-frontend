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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Package, Settings, PackageOpen, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { lostFoundApi } from "@/lib/api/lostFoundApi";
import { LostFound } from "@/types/lost-found";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Image from "next/image";

// Form schemas
const lostFoundSchema = z.object({
  product_sku: z.string().min(1, "Product sku is required"),
  reason: z.string().min(1, "Reason is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type LostFoundFormData = z.infer<typeof lostFoundSchema>;

interface LostFoundDialogProps {
  lostFoundId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile" | "delete";
  onLostFoundUpdate?: () => void;
}

export function LostFoundDialog({
  lostFoundId,
  open,
  onOpenChange,
  initialTab = "detail",
  onLostFoundUpdate,
}: LostFoundDialogProps) {
  const [lostFound, setLostFound] = useState<LostFound | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // LostFound form
  const lostFoundForm = useForm<LostFoundFormData>({
    resolver: zodResolver(lostFoundSchema),
    defaultValues: {
      product_sku: "",
      reason: "",
      quantity: 0,
    },
  });

  // Fetch lost found details
  const fetchLostFoundDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await lostFoundApi.getLostFoundById(id);
        const lostFoundData = response.data;
        setLostFound(lostFoundData);
        // Update lost found form with data
        lostFoundForm.reset({
          product_sku: lostFoundData.product_sku,
          reason: lostFoundData.reason,
          quantity: lostFoundData.quantity,
        });
      } catch (error) {
        console.error("Error fetching lost found details:", error);
        toast.error("Failed to fetch lost found details.", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [lostFoundForm]
  );

  // Update lost found
  const updateLostFound = async (data: LostFoundFormData) => {
    if (!lostFoundId) return;

    try {
      setUpdating(true);
      const response = await lostFoundApi.updateLostFound(lostFoundId, {
        product_sku: data.product_sku,
        reason: data.reason,
        quantity: data.quantity,
      });

      toast.success("Lost found updated successfully");
      // Update local lost found state with the returned data
      setLostFound(response.data);
      // Also update the form with the new data
      lostFoundForm.reset({
        product_sku: response.data.product_sku,
        reason: response.data.reason,
        quantity: response.data.quantity,
      });
      onLostFoundUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating lost found:", error);
      toast.error("Failed to update lost found", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete lost found
  const deleteLostFound = async () => {
    if (!lostFoundId) return;
    try {
      setUpdating(true);
      await lostFoundApi.deleteLostFound(lostFoundId);
      toast.success("Lost found deleted successfully");
      onLostFoundUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting lost found:", error);
      toast.error("Failed to delete lost found", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && lostFoundId) {
      fetchLostFoundDetail(lostFoundId);
      setActiveTab(initialTab);
    } else {
      setLostFound(null);
      lostFoundForm.reset({
        product_sku: "",
        reason: "",
        quantity: 0,
      });
    }
  }, [open, lostFoundId, initialTab, fetchLostFoundDetail, lostFoundForm]);

  // Update form when lost found data changes
  useEffect(() => {
    if (lostFound) {
      lostFoundForm.reset({
        product_sku: lostFound.product_sku,
        reason: lostFound.reason,
        quantity: lostFound.quantity,
      });
    }
  }, [lostFound, lostFoundForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-5xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : lostFound
              ? `${lostFound.product_sku}`
              : "Lost Found Details"}
          </DialogTitle>
          <DialogDescription>
            {lostFound
              ? `Manage lost found details for ${lostFound.product_sku}.`
              : "View and manage lost found information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading lost found details...
          </div>
        ) : lostFound ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "detail" | "profile" | "delete")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Edit Lost Found
              </TabsTrigger>
              <TabsTrigger value="delete" className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Delete Lost Found</span>
              </TabsTrigger>
            </TabsList>

            <div>
              <div className="flex-1 overflow-y-auto">
                {/* Lost Found Details Tab */}
                <TabsContent value="detail" className="space-y-6">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <PackageOpen className="h-5 w-5" />
                        Detail Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-start gap-4">
                        <Image
                          src={lostFound.product?.image || "N/A"}
                          alt={lostFound.product_sku}
                          width={180}
                          height={180}
                          className="rounded-lg object-cover border"
                        />
                        <div className="border rounded-md w-100">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="w-32">
                                  Product SKU
                                </TableCell>
                                <TableCell className="w-10">:</TableCell>
                                <TableCell className="max-w-md">
                                  <span className="max-w-md text-wrap wrap-break-word">
                                    {lostFound.product_sku}
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-32">Reason</TableCell>
                                <TableCell className="w-10">:</TableCell>
                                <TableCell className="max-w-md">
                                  <span className="max-w-md text-wrap wrap-break-word">
                                    {lostFound.reason}
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-32">Quantity</TableCell>
                                <TableCell className="w-10">:</TableCell>
                                <TableCell>{lostFound.quantity}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-32">Created</TableCell>
                                <TableCell className="w-10">:</TableCell>
                                <TableCell className="max-w-md">
                                  <span className="max-w-md text-wrap wrap-break-word">
                                    {format(
                                      new Date(lostFound.created_at),
                                      "dd MMMM yyyy - HH:mm:ss"
                                    )}
                                  </span>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Lost Found Tab */}
                <TabsContent value="profile">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <Settings className="h-5 w-5" />
                        Edit Lost Found Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...lostFoundForm}>
                        <form
                          onSubmit={lostFoundForm.handleSubmit(updateLostFound)}
                          className="space-y-6"
                        >
                          <FormField
                            control={lostFoundForm.control}
                            name="product_sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product SKU</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter product SKU"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={lostFoundForm.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter reason"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={lostFoundForm.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder="Enter quantity"
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => onOpenChange(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updating}
                              className="cursor-pointer"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Lost Found
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Delete Lost Found Tab */}
                <TabsContent value="delete">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <PackageOpen className="h-5 w-5 text-destructive" />
                        <span className="text-destructive">
                          Delete Lost Found
                        </span>
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      {/* Warning Message */}
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-semibold text-red-900 dark:text-red-100">
                              Warning: This action cannot be undone
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-200">
                              Deleting this will permanently remove it from
                              database. Daleted data will no longer be available
                              for processing or modification.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="cursor-pointer"
                          onClick={deleteLostFound}
                          disabled={updating}
                        >
                          {updating && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Delete Lost Found
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No lost found selected or lost found not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
