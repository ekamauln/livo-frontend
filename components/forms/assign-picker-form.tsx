"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { orderApi } from "@/lib/api/orderApi";
import { userManagerApi } from "@/lib/api/userManagerApi";
import { Combobox, Item } from "@/components/custom-ui/combobox";
import { User } from "@/types/auth";
import { FocusScope } from "@radix-ui/react-focus-scope";

const formSchema = z.object({
  pickerId: z.number().min(1, { message: "Picker is required" }),
  tracking: z
    .string()
    .min(1, { message: "Tracking number is required" })
    .trim(),
});

type FormData = z.infer<typeof formSchema>;

interface AssignPickerFormProps {
  onAssignSuccess?: () => void;
}

export function AssignPickerForm({ onAssignSuccess }: AssignPickerFormProps) {
  const trackingInputRef = useRef<HTMLInputElement>(null);
  const [pickers, setPickers] = useState<Item[]>([]);
  const [isLoadingPickers, setIsLoadingPickers] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickerId: 0,
      tracking: "",
    },
  });

  // Helper function to focus the tracking input
  const focusTrackingInput = useCallback(() => {
    if (trackingInputRef.current) {
      trackingInputRef.current.focus();
    }
  }, []);

  // Fetch users with picker role
  const fetchPickers = useCallback(async () => {
    try {
      setIsLoadingPickers(true);
      // Fetch all users (you might want to increase the limit or handle pagination)
      const response = await userManagerApi.getUsers(1, 100);

      // Extract users array from response
      const users = response.data.users as User[];

      // Filter users who have 'picker' role
      const pickerUsers = users.filter((user: User) =>
        user.roles?.some((role) => role.name.toLowerCase() === "picker")
      );

      // Transform to combobox items
      const pickerItems: Item[] = pickerUsers.map((user: User) => ({
        value: user.id.toString(),
        label: `${user.full_name} (${user.username})`,
      }));

      setPickers(pickerItems);
    } catch (error) {
      console.error("Error fetching pickers:", error);
      toast.error("Failed to load pickers", {
        description: "Please try refreshing the page",
      });
    } finally {
      setIsLoadingPickers(false);
    }
  }, []);

  // Load pickers on mount
  useEffect(() => {
    fetchPickers();
  }, [fetchPickers]);

  // Focus on tracking input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      focusTrackingInput();
    }, 100);

    return () => clearTimeout(timer);
  }, [focusTrackingInput]);

  const onSubmit = async (data: FormData) => {
    try {
      await orderApi.assigningOrder(data.pickerId, data.tracking);

      toast.success("Order assigned successfully!");
      form.reset({
        pickerId: data.pickerId, // Keep the selected picker
        tracking: "",
      });
      onAssignSuccess?.();

      // Focus back to tracking input for next entry
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    } catch (error) {
      console.error("Error assigning order:", error);

      let errorMessage = "Failed to assign order";
      const toastDescription = "Please try again";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Set form error
      form.setError("tracking", { message: errorMessage });

      // Clear the tracking input on error
      form.setValue("tracking", "");

      // Show toast with error
      toast.error(errorMessage, {
        description: toastDescription,
      });

      // Focus back to tracking input after error
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    }
  };

  return (
    <Form {...form}>
      <FocusScope trapped={true}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="pickerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Picker</FormLabel>
                <FormControl>
                  <Combobox
                    items={pickers}
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder={
                      isLoadingPickers
                        ? "Loading pickers..."
                        : "Select a picker..."
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tracking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter tracking number (e.g., JNE1234567890)"
                    disabled={form.formState.isSubmitting}
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      trackingInputRef.current = e;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              !form.watch("tracking").trim() ||
              form.watch("pickerId") === 0
            }
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assign Order
          </Button>
        </form>
      </FocusScope>
    </Form>
  );
}
