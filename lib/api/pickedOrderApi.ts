import { PickedOrder, PickedOrderResponse } from "@/types/picked-order";
import { ApiResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const pickOrderApi = {
  getPickedOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    start_date?: string,
    end_date?: string
  ): Promise<PickedOrderResponse> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const startDateParam = start_date ? `&start_date=${start_date}` : "";
    const endDateParam = end_date ? `&end_date=${end_date}` : "";
    return apiRequest<PickedOrderResponse>(
      `/picked-orders?page=${page}&limit=${limit}${searchParam}${startDateParam}${endDateParam}`
    );
  },

  getPickedOrderById: async (id: number): Promise<ApiResponse<PickedOrder>> => {
    return apiRequest<ApiResponse<PickedOrder>>(`/picked-orders/${id}`);
  },
};
