"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PackagePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LostFound } from "@/types/lost-found";
import { lostFoundApi } from "@/lib/api/lostFoundApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const lostFoundCreateSchema = z.object({
  product_sku: z.string().min(1, "Product SKU is required"),
  reason: z.string().min(1, "Reason is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type LostFoundCreateFormData = z.infer<typeof lostFoundCreateSchema>;

interface LostFoundCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLostFoundCreated: (lostFound: LostFound) => void;
}

export function LostFoundCreateDialog({
  isOpen,
  onOpenChange,
  onLostFoundCreated,
}: LostFoundCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create lost found form
  const lostFoundCreateForm = useForm<LostFoundCreateFormData>({
    resolver: zodResolver(lostFoundCreateSchema),
    defaultValues: {
      product_sku: "",
      reason: "",
      quantity: 1,
    },
  });

  // Handle form submission
  const onSubmit = async (data: LostFoundCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await lostFoundApi.createLostFound(data);
      const lostFound = response.data as LostFound;
      onLostFoundCreated(lostFound);
      lostFoundCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create lost found. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" /> Create New Lost Found
          </DialogTitle>
          <DialogDescription>
            Create a new lost found by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...lostFoundCreateForm}>
            <form
              onSubmit={lostFoundCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={lostFoundCreateForm.control}
                name="product_sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lostFoundCreateForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lostFoundCreateForm.control}
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
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PackagePlus className="mr-2 h-4 w-4" />
                  )}
                  Create New Lost Found
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
