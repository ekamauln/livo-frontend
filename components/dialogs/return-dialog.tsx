"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Edit, Save, X, Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Return } from "@/types/return";
import { returnApi } from "@/lib/api/returnApi";
import { ApiError } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

// Form schema for editing return data
const editDataFormSchema = z.object({
  old_tracking: z.string().min(1, "Old tracking is required"),
  return_reason: z.string().min(1, "Return reason is required"),
  return_type: z.string().min(1, "Return type is required"),
  return_number: z.string().min(1, "Return number is required"),
  scrap_number: z.string().min(1, "Scrap number is required"),
});

type EditDataFormValues = z.infer<typeof editDataFormSchema>;

interface ReturnDialogProps {
  returnId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "edit-data";
  onReturnUpdate?: () => void;
}

export function ReturnDialog({
  returnId,
  open,
  onOpenChange,
  initialTab = "detail",
  onReturnUpdate,
}: ReturnDialogProps) {
  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);
  const [returnTypeSearchOpen, setReturnTypeSearchOpen] = useState(false);
  const [returnTypeSearch, setReturnTypeSearch] = useState("");

  // Return type options
  const returnTypeOptions = [
    { value: "retur", label: "Retur" },
    { value: "tukar", label: "Tukar" },
    { value: "gagal kirim", label: "Gagal Kirim" },
    { value: "batal", label: "Batal" },
    { value: "double", label: "Double" },
  ];

  // Get selected return type display text
  const getSelectedReturnTypeText = (return_type: string) => {
    if (!return_type) return "Select return type...";
    const option = returnTypeOptions.find((opt) => opt.value === return_type);
    return option ? option.label : return_type;
  };

  // Return data form
  const editDataForm = useForm<EditDataFormValues>({
    resolver: zodResolver(editDataFormSchema),
    defaultValues: {
      old_tracking: "",
      return_reason: "",
      return_type: "",
      return_number: "",
      scrap_number: "",
    },
  });

  // Fetch return details
  const fetchReturnDetails = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const result = await returnApi.getReturnById(id);

        if (result.success) {
          const returnData = result.data;

          if (returnData) {
            setReturnData(returnData);

            editDataForm.reset({
              old_tracking: returnData.old_tracking || "",
              return_reason: returnData.return_reason || "",
              return_type: returnData.return_type || "",
              return_number: returnData.return_number || "",
              scrap_number: returnData.scrap_number || "",
            });
          } else {
            throw new Error("Return data not found in response");
          }
        } else {
          throw new Error(result.message || "Failed to fetch return details");
        }
      } catch (error) {
        console.error("Error fetching return details:", error);
        if (error instanceof ApiError) {
          if (error.status === 400) {
            toast.error("Invalid request", {
              description:
                error.message ||
                "The request data is invalid. Please check and try again.",
            });
          } else {
            toast.error("Failed to fetch return details", {
              description: error.message,
            });
          }
        } else {
          toast.error("Failed to fetch return details", {
            description:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [editDataForm]
  );

  // Update return data
  const updateReturnData = async (data: EditDataFormValues) => {
    if (!returnId) return;

    try {
      setUpdating(true);
      const result = await returnApi.updateReturn(returnId, {
        old_tracking: data.old_tracking,
        return_reason: data.return_reason,
        return_type: data.return_type,
        return_number: data.return_number,
        scrap_number: data.scrap_number,
      });

      if (result.success) {
        const updatedReturn = result.data;

        if (updatedReturn) {
          toast.success("Return data updated successfully");
          // Update local return state
          setReturnData(updatedReturn);
          // Update both forms with new data
          editDataForm.reset({
            old_tracking: updatedReturn.old_tracking || "",
            return_reason: updatedReturn.return_reason || "",
            return_type: updatedReturn.return_type || "",
            return_number: updatedReturn.return_number || "",
            scrap_number: updatedReturn.scrap_number || "",
          });
          onReturnUpdate?.();
          onOpenChange(false);
        } else {
          throw new Error("Updated return data not found in response");
        }
      } else {
        throw new Error(result.message || "Failed to update return data");
      }
    } catch (error) {
      console.error("Error updating return data:", error);
      if (error instanceof ApiError) {
        if (error.status === 400) {
          toast.error("Invalid data", {
            description:
              error.message ||
              "The submitted data is invalid. Please check all fields and try again.",
          });
        } else {
          toast.error("Failed to update return data", {
            description: error.message,
          });
        }
      } else {
        toast.error("Failed to update return data", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && returnId) {
      fetchReturnDetails(returnId);
      setActiveTab(initialTab);
    } else {
      setReturnData(null);
      editDataForm.reset({
        old_tracking: "",
        return_reason: "",
        return_type: "",
        return_number: "",
        scrap_number: "",
      });
    }
  }, [open, returnId, initialTab, fetchReturnDetails, editDataForm]);

  // Update forms when return data changes
  useEffect(() => {
    if (returnData) {
      editDataForm.reset({
        old_tracking: returnData.old_tracking || "",
        return_reason: returnData.return_reason || "",
        return_type: returnData.return_type || "",
        return_number: returnData.return_number || "",
        scrap_number: returnData.scrap_number || "",
      });
    }
  }, [returnData, editDataForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : returnData
              ? `Return #${returnData.id} - ${returnData.new_tracking}`
              : "Return Details"}
          </DialogTitle>
          <DialogDescription>
            {returnData
              ? `View and manage return details for tracking ${returnData.new_tracking}`
              : "View and manage return details"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Package className="h-6 w-6 animate-spin mr-2" />
            Loading return details...
          </div>
        ) : returnData ? (
          <Tabs
            value={activeTab}
            onValueChange={(value: string) =>
              setActiveTab(value as "detail" | "edit-data")
            }
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className={`grid w-full grid-cols-2 shrink-0`}>
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>

              <TabsTrigger
                value="edit-data"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Data
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4">
              <div>
                {/* Detail Tab */}
                <TabsContent value="detail" className="space-y-6 mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Return Information
                          </h3>
                          <Badge variant="outline">ID: {returnData.id}</Badge>
                        </div>
                        <div className="border rounded-md">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  New Tracking
                                </TableCell>
                                <TableCell className="max-w-md">
                                  {returnData.new_tracking}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Old Tracking
                                </TableCell>
                                <TableCell>
                                  {returnData.old_tracking || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">Channel</TableCell>
                                <TableCell>
                                  {returnData.channel?.name}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Store ID
                                </TableCell>
                                <TableCell>{returnData.store?.name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Return Type
                                </TableCell>
                                <TableCell>
                                  {returnData.return_type || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Return Reason
                                </TableCell>
                                <TableCell className="wrap-break-word whitespace-normal max-w-md">
                                  {returnData.return_reason || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Return Number
                                </TableCell>
                                <TableCell>
                                  {returnData.return_number || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">
                                  Scrap Number
                                </TableCell>
                                <TableCell>
                                  {returnData.scrap_number || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="w-1/4">Created</TableCell>
                                <TableCell>
                                  {format(
                                    new Date(returnData.created_at),
                                    "dd MMMM yyyy - HH:mm"
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Return Details Section */}
                      {(() => {
                        const details =
                          returnData.return_details || returnData.details || [];
                        if (details.length === 0) return null;

                        return (
                          <>
                            <div className="space-y-4 mt-6">
                              <h3 className="text-lg font-semibold">
                                Return Details ({details.length}{" "}
                                {details.length === 1 ? "item" : "items"})
                              </h3>
                              <div className="space-y-3">
                                {details.map((detail) => (
                                  <div
                                    key={detail.id}
                                    className="border rounded-lg p-4 bg-muted/30"
                                  >
                                    <div className="flex gap-4">
                                      {/* Product Image */}
                                      {detail.product?.image && (
                                        <div className="shrink-0">
                                          <Image
                                            src={detail.product.image}
                                            alt={
                                              detail.product.name || "Product"
                                            }
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 object-cover rounded-md border"
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "/images/placeholder.png";
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* Product Details */}
                                      <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1">
                                            <div className="font-medium">
                                              {detail.product?.name ||
                                                `Product ID: ${detail.product_id}`}
                                            </div>
                                            {detail.product?.sku && (
                                              <div className="text-sm text-muted-foreground font-mono">
                                                SKU: {detail.product.sku}
                                              </div>
                                            )}
                                            {detail.product?.variant &&
                                              detail.product.variant !==
                                                "-" && (
                                                <div className="text-sm text-muted-foreground">
                                                  Variant:{" "}
                                                  {detail.product.variant}
                                                </div>
                                              )}
                                            {detail.product?.barcode && (
                                              <div className="text-sm text-muted-foreground font-mono">
                                                Barcode:{" "}
                                                {detail.product.barcode}
                                              </div>
                                            )}
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            Qty: {detail.quantity}
                                          </Badge>
                                        </div>

                                        {detail.product?.location && (
                                          <div className="text-sm text-muted-foreground">
                                            <span className="font-medium">
                                              Location:
                                            </span>{" "}
                                            {detail.product.location}
                                          </div>
                                        )}

                                        <div className="text-xs text-muted-foreground">
                                          Added:{" "}
                                          {format(
                                            new Date(detail.created_at),
                                            "dd MMMM yyyy - HH:mm"
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="edit-data" className="space-y-4 mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">
                            Edit Return Data
                          </h3>
                        </div>
                        <Separator />
                        <Form {...editDataForm}>
                          <form
                            onSubmit={editDataForm.handleSubmit(
                              updateReturnData
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={editDataForm.control}
                              name="old_tracking"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Old Tracking</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Enter old tracking number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="return_type"
                              render={({ field: returnTypeField }) => (
                                <FormItem>
                                  <FormLabel>Return Type</FormLabel>
                                  <FormControl>
                                    <Popover
                                      open={returnTypeSearchOpen}
                                      onOpenChange={setReturnTypeSearchOpen}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={returnTypeSearchOpen}
                                          className="w-full justify-between"
                                          disabled={updating}
                                        >
                                          {getSelectedReturnTypeText(
                                            returnTypeField.value
                                          )}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0">
                                        <Command shouldFilter={false}>
                                          <CommandInput
                                            placeholder="Search return type..."
                                            value={returnTypeSearch}
                                            onValueChange={setReturnTypeSearch}
                                          />
                                          <CommandList>
                                            <CommandEmpty>
                                              {returnTypeSearch
                                                ? `No return types found for "${returnTypeSearch}"`
                                                : "No return types found."}
                                            </CommandEmpty>
                                            <CommandGroup>
                                              {returnTypeOptions
                                                .filter((option) => {
                                                  const searchTerm =
                                                    returnTypeSearch.toLowerCase();
                                                  if (!searchTerm) return true;
                                                  return option.label
                                                    .toLowerCase()
                                                    .includes(searchTerm);
                                                })
                                                .map((option) => (
                                                  <CommandItem
                                                    key={option.value}
                                                    value={option.value}
                                                    onSelect={() => {
                                                      returnTypeField.onChange(
                                                        option.value
                                                      );
                                                      setReturnTypeSearchOpen(
                                                        false
                                                      );
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        returnTypeField.value ===
                                                          option.value
                                                          ? "opacity-100"
                                                          : "opacity-0"
                                                      )}
                                                    />
                                                    {option.label}
                                                  </CommandItem>
                                                ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="return_reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Reason</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Enter return reason"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="return_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Enter return number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="scrap_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Scrap Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Enter scrap number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={updating}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updating}>
                                <Save className="mr-2 h-4 w-4" />
                                {updating ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No return selected or return not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
