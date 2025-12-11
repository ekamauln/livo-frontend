import { Return } from "@/types/return";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const returnApi = {
  getReturns: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Return>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    return apiRequest<PaginatedResponse<Return>>(
      `/returns?${params.toString()}`
    );
  },

  getReturnById: async (id: number): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>(`/returns/${id}`);
  },

  createReturn: async (returnData: {
    new_tracking: string;
    old_tracking: string;
    channel_id: number;
    store_id: number;
    return_type: string;
    return_reason: string;
    return_number?: string;
    scrap_number?: string;
  }): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>("/returns", {
      method: "POST",
      body: JSON.stringify(returnData),
    });
  },

  updateReturn: async (
    id: number,
    returnData: {
      old_tracking: string;
      return_type: string;
      return_reason: string;
      return_number?: string;
      scrap_number?: string;
    }
  ): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>(`/returns/${id}`, {
      method: "PUT",
      body: JSON.stringify(returnData),
    });
  },
};
