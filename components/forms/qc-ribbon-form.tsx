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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { boxApi } from "@/lib/api/boxApi";
import { qcRibbonApi } from "@/lib/api/qcRibbonApi";
import type { Order } from "@/types/order";
import type { Box } from "@/types/box";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { format } from "date-fns/format";
import { Combobox } from "@/components/custom-ui/combobox";

// Schema for product verification
const productVerificationSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

// Schema for QC ribbon details
const qcRibbonDetailSchema = z.object({
  box_id: z.number().min(1, "Box is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type ProductVerificationData = z.infer<typeof productVerificationSchema>;
type QcRibbonDetailData = z.infer<typeof qcRibbonDetailSchema>;

interface VerifiedProduct {
  sku: string;
  product_name: string;
  variant?: string;
  quantity: number;
  verified: boolean;
}

interface QcRibbonFormProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function QcRibbonForm({
  order,
  onSuccess,
  onCancel,
}: QcRibbonFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifiedProducts, setVerifiedProducts] = useState<VerifiedProduct[]>(
    []
  );
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [qcRibbonDetails, setQcRibbonDetails] = useState<QcRibbonDetailData[]>(
    []
  );
  const [autoFocusCombobox, setAutoFocusCombobox] = useState(false);
  const skuInputRef = React.useRef<HTMLInputElement>(null);

  // Form for product verification
  const productForm = useForm<ProductVerificationData>({
    resolver: zodResolver(productVerificationSchema),
    defaultValues: {
      sku: "",
      quantity: 1,
    },
  });

  // Form for QC ribbon detail
  const detailForm = useForm<QcRibbonDetailData>({
    resolver: zodResolver(qcRibbonDetailSchema),
    defaultValues: {
      box_id: 0,
      quantity: 1,
    },
  });

  // Verify product
  const handleVerifyProduct = (data: ProductVerificationData) => {
    // Find product in order details
    const orderDetail = order.order_details.find(
      (detail) => detail.sku.toLowerCase() === data.sku.toLowerCase()
    );

    if (!orderDetail) {
      toast.error("Product not found", {
        description: `SKU "${data.sku}" is not in this order`,
      });
      return;
    }

    // Check if quantity matches
    if (orderDetail.quantity !== data.quantity) {
      toast.error("Quantity mismatch", {
        description: `Expected ${orderDetail.quantity}, got ${data.quantity}`,
      });
      return;
    }

    // Check if already verified
    if (
      verifiedProducts.some(
        (p) => p.sku.toLowerCase() === data.sku.toLowerCase()
      )
    ) {
      toast.warning("Already verified", {
        description: `SKU "${data.sku}" has already been verified`,
      });
      return;
    }

    // Add to verified products
    setVerifiedProducts([
      ...verifiedProducts,
      {
        sku: orderDetail.sku,
        product_name: orderDetail.product_name,
        variant: orderDetail.variant,
        quantity: orderDetail.quantity,
        verified: true,
      },
    ]);

    toast.success("Product verified!", {
      description: `${orderDetail.product_name} - Qty: ${orderDetail.quantity}`,
    });

    productForm.reset();

    // Focus back to SKU input after verification
    setTimeout(() => {
      skuInputRef.current?.focus();
    }, 100);
  };

  // Check if all products verified
  const allProductsVerified = () => {
    return (
      order.order_details.length === verifiedProducts.length &&
      verifiedProducts.length > 0
    );
  };

  // Proceed to step 2
  const handleProceedToStep2 = async () => {
    if (!allProductsVerified()) {
      toast.error("Incomplete verification", {
        description: "Please verify all products before proceeding",
      });
      return;
    }

    // Fetch boxes
    try {
      setLoadingBoxes(true);
      const response = await boxApi.getBoxes(1, 100); // Get all boxes
      setBoxes(response.data.boxes as Box[]);
      setCurrentStep(2);
      // Trigger autofocus for combobox in step 2
      setAutoFocusCombobox(true);
    } catch (error) {
      console.error("Error fetching boxes:", error);
      toast.error("Failed to load boxes", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoadingBoxes(false);
    }
  };

  // Add QC ribbon detail
  const handleAddDetail = (data: QcRibbonDetailData) => {
    // Check if box already added
    if (qcRibbonDetails.some((d) => d.box_id === data.box_id)) {
      toast.warning("Box already added", {
        description: "This box has already been added to the list",
      });
      return;
    }

    setQcRibbonDetails([...qcRibbonDetails, data]);
    toast.success("Detail added!");
    detailForm.reset({ box_id: 0, quantity: 1 });
    // Trigger autofocus back to combobox after adding detail
    setAutoFocusCombobox(false);
    setTimeout(() => setAutoFocusCombobox(true), 50);
  };

  // Remove QC ribbon detail
  const handleRemoveDetail = (index: number) => {
    setQcRibbonDetails(qcRibbonDetails.filter((_, i) => i !== index));
    toast.info("Detail removed");
  };

  // Submit QC ribbon
  const handleSubmit = async () => {
    if (qcRibbonDetails.length === 0) {
      toast.error("No details added", {
        description: "Please add at least one box detail",
      });
      return;
    }

    try {
      setLoading(true);

      await qcRibbonApi.createQcRibbon({
        tracking: order.tracking,
        details: qcRibbonDetails,
      });

      toast.success("QC Ribbon created successfully!");

      // Reset form
      productForm.reset();
      detailForm.reset();
      setVerifiedProducts([]);
      setQcRibbonDetails([]);
      setCurrentStep(1);

      onSuccess?.();
    } catch (error) {
      console.error("Error creating QC ribbon:", error);
      toast.error("Failed to create QC ribbon", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get box name by ID
  const getBoxName = (boxId: number) => {
    const box = boxes.find((b) => b.id === boxId);
    return box ? `${box.code} - ${box.name}` : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div
          className={`flex items-center gap-2 ${
            currentStep === 1 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">Verify Order</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 ${
            currentStep === 2 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">QC Details</span>
        </div>
      </div>

      {/* Step 1: Order Verification */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Tracking:</span>{" "}
                  {order.tracking}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge className="bg-green-500 text-white hover:bg-green-600 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                    {order.processing_status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Picker:</span> {order.picked_by}
                </div>
                <div>
                  <span className="font-medium">Picked At:</span>{" "}
                  {order.picked_at && order.picked_at !== "-"
                    ? format(new Date(order.picked_at), "dd MMM yyyy, HH:mm:ss")
                    : "-"}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">
                  Products to verify: {order.order_details.length}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {order.order_details.map((detail, index) => {
                    const isVerified = verifiedProducts.some(
                      (p) => p.sku.toLowerCase() === detail.sku.toLowerCase()
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {detail.product?.image && (
                              <Image
                                src={detail.product.image}
                                alt={detail.product_name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="text-xs text-muted-foreground">
                              Qty: {detail.quantity}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium truncate max-w-[180px]">
                              {detail.product_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              SKU: {detail.sku}
                            </div>
                          </div>
                        </div>
                        {isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Verification Form */}
          <Card>
            <CardContent>
              <Form {...productForm}>
                <form
                  onSubmit={productForm.handleSubmit(handleVerifyProduct)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-4 gap-2 items-end">
                    <div className="col-span-2">
                      <FormField
                        control={productForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Scan or enter SKU"
                                disabled={allProductsVerified()}
                                autoFocus
                                {...field}
                                ref={(e) => {
                                  field.ref(e);
                                  skuInputRef.current = e;
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={productForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              disabled={allProductsVerified()}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={allProductsVerified()}
                      className="w-full"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify Product
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Proceed Button */}
          <div className="flex justify-items-center gap-2 justify-end">
            <Button
              size="lg"
              variant="outline"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToStep2}
              disabled={!allProductsVerified() || loadingBoxes}
              size="lg"
            >
              {loadingBoxes && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Proceed to QC Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: QC Ribbon Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Tracking:</span>{" "}
                  {order.tracking}
                </div>
                <div>
                  <span className="font-medium">Products Verified:</span>{" "}
                  {verifiedProducts.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add QC Ribbon Detail Form */}
          <Card>
            <CardContent>
              <Form {...detailForm}>
                <form
                  onSubmit={detailForm.handleSubmit(handleAddDetail)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-4 items-end gap-2">
                    <div className="col-span-2">
                      <FormField
                        control={detailForm.control}
                        name="box_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Box</FormLabel>
                            <FormControl>
                              <Combobox
                                items={boxes.map((box) => ({
                                  value: box.id.toString(),
                                  label: `${box.code} - ${box.name}`,
                                }))}
                                value={field.value.toString()}
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                placeholder="Select box"
                                autoFocus={autoFocusCombobox}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={detailForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Box
                    </Button>
                  </div>
                </form>
              </Form>

              {/* QC Ribbon Details List */}
              {qcRibbonDetails.length > 0 && (
                <div className="mt-4">
                  <Separator className="my-4" />
                  <p className="text-sm font-medium mb-2">
                    Added Box ({qcRibbonDetails.length})
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {qcRibbonDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {getBoxName(detail.box_id)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {detail.quantity}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDetail(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              disabled={loading}
              type="button"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={qcRibbonDetails.length === 0 || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create QC Ribbon
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
