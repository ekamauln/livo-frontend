import { LostFound } from "@/types/lost-found";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const lostFoundApi = {
  getLostFounds: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<LostFound>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<LostFound>>(
      `/lost-founds?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getLostFoundById: async (id: number): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lost-founds/${id}`);
  },

  createLostFound: async (lostFoundData: {
    product_sku: string;
    quantity: number;
    reason: string;
  }): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>("/lost-founds", {
      method: "POST",
      body: JSON.stringify(lostFoundData),
    });
  },

  updateLostFound: async (
    id: number,
    lostFoundData: {
      product_sku: string;
      quantity: number;
      reason: string;
    }
  ): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lost-founds/${id}`, {
      method: "PUT",
      body: JSON.stringify(lostFoundData),
    });
  },

  deleteLostFound: async (id: number): Promise<ApiResponse<LostFound>> => {
    return apiRequest<ApiResponse<LostFound>>(`/lost-founds/${id}`, {
      method: "DELETE",
    });
  },
};
