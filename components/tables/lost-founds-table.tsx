"use client";

import { useState, useEffect } from "react";
import { LostFound } from "@/types/lost-found";
import { lostFoundApi } from "@/lib/api/lostFoundApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LostFoundsTable() {
  const [data, setData] = useState<LostFound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching lost & found items...");
        const response = await lostFoundApi.getLostFounds(
          pagination.page,
          pagination.limit
        );
        console.log("API Response:", response);
        const lostFounds = (response.data.lost_founds || []) as LostFound[];
        console.log("Lost founds:", lostFounds);
        setData(lostFounds);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching lost & found items:", error);
        if (error instanceof Error) {
          toast.error(`Failed to fetch lost & found items: ${error.message}`);
        } else {
          toast.error("Failed to fetch lost & found items.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading lost & found items...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold">Lost & Found Items</h2>
      
      {data.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No lost & found items found.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="font-semibold text-lg">
                    {item.product?.name || item.product_sku}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {item.product_sku}
                  </div>
                  {item.product?.variant && (
                    <div className="text-sm text-muted-foreground">
                      Variant: {item.product.variant}
                    </div>
                  )}
                  <div className="text-sm">
                    Quantity: <span className="font-semibold">{item.quantity}</span>
                  </div>
                  <div className="text-sm">
                    Reason: <span className="italic">{item.reason}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Created by: {item.create_operator?.full_name || `User #${item.created_by}`}
                    {" · "}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                {item.product?.image && (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="object-cover rounded"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Showing {data.length} of {pagination.total} items
      </div>
    </div>
  );
}
