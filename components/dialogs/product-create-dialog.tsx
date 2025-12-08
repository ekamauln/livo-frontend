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
import { Loader2, PackageOpen, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { productApi } from "@/lib/api/productApi";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { FormDescription } from "@/components/ui/form";

// Zod form schema
const productCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Image must be a valid URL").optional(),
  variant: z.string().min(1, "Variant is required"),
  location: z.string().min(1, "Location is required"),
  barcode: z.string().min(1, "Barcode is required"),
});

type ProductCreateFormData = z.infer<typeof productCreateSchema>;

interface ProductCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: Product) => void;
}

export function ProductCreateDialog({
  isOpen,
  onOpenChange,
  onProductCreated,
}: ProductCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Create product form
  const productCreateForm = useForm<ProductCreateFormData>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      sku: "",
      name: "",
      image: "",
      variant: "",
      location: "",
      barcode: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProductCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await productApi.createProduct(data);
      const product = response.data as Product;
      onProductCreated(product);
      toast.success("Product created successfully!");
      productCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update the form with the new image URL
        productCreateForm.setValue("image", result.url);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUploading(false);
      // Clear the input so the same file can be selected again if needed
      event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5" /> Create New Product
          </DialogTitle>
          <DialogDescription>
            Create a new product by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...productCreateForm}>
            <form
              onSubmit={productCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={productCreateForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="text"
                          placeholder="Enter image URL or upload a file below"
                          {...field}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            or
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            onClick={() =>
                              document
                                .getElementById("file-upload-create")
                                ?.click()
                            }
                            className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent/90 all duration-300 ease-in-out"
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploading ? "Uploading..." : "Upload Image"}
                          </Button>
                          <input
                            id="file-upload-create"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </div>
                        {field.value && (
                          <div className="mt-2">
                            <Image
                              src={field.value}
                              alt="Product preview"
                              width={100}
                              height={100}
                              className="rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-yellow-500">
                      * Enter a direct image URL or upload an image file.
                      Uploaded images will be saved to /images/products/.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter variant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter barcode" {...field} />
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
                    <PackageOpen className="mr-2 h-4 w-4" />
                  )}
                  Create New Product
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
