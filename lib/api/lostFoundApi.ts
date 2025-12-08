import { LostFound } from "@/types/lost-found";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const lostFoundApi = {
  getLostFoundItems: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<LostFound>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<LostFound>>(
      `/lostfound?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getLostFoundItemById: async (id: number): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lostfound/${id}`);
  },

  createLostFoundItem: async (itemData: {
    product_sku: string;
    quantity: number;
    reason: string;
  }): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>("/lostfound", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  },

  updateLostFoundItem: async (
    id: number,
    itemData: {
      product_sku: string;
      quantity: number;
      reason: string;
    }
  ): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lostfound/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    });
  },

  deleteLostFoundItem: async (id: number): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lostfound/${id}`, {
      method: "DELETE",
    });
  },
};
