import { Order, OrderDetail } from "@/types/order";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "./types";

export const orderApi = {
  getOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    return apiRequest<PaginatedResponse<Order>>(`/orders?${params.toString()}`);
  },

  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`);
  },

  getOrderDetails: async (id: number): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`);
  },

  bulkImportOrders: async (ordersData: {
    orders: Array<{
      order_ginee_id: string;
      status: string;
      channel?: string;
      store?: string;
      buyer?: string;
      address?: string;
      tracking?: string;
      courier?: string;
      sent_before?: string;
      order_details: Array<{
        sku?: string;
        product_name: string;
        variant?: string;
        quantity?: number;
      }>;
    }>;
  }): Promise<
    ApiResponse<{
      summary: {
        total: number;
        created: number;
        failed: number;
        skipped: number;
      };
      details?: Array<{
        order_id: string;
        status: string;
        message?: string;
      }>;
    }>
  > => {
    return apiRequest<
      ApiResponse<{
        summary: {
          total: number;
          created: number;
          failed: number;
          skipped: number;
        };
        details?: Array<{
          order_id: string;
          status: string;
          message?: string;
        }>;
      }>
    >("/orders/bulk", {
      method: "POST",
      body: JSON.stringify(ordersData),
    });
  },

  updateOrder: async (
    id: number,
    orderData: {
      event_status?: string;
      channel: string;
      store: string;
      buyer: string;
      address: string;
      courier: string;
      tracking: string;
      sent_before: string;
      order_details: Array<{
        id?: number;
        sku: string;
        product_name: string;
        variant?: string;
        quantity: number;
      }>;
    }
  ): Promise<ApiResponse<Order>> =>
    apiRequest<ApiResponse<Order>>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    }),

  createOrderDetail: async (
    orderId: number,
    detailData: {
      sku: string;
      product_name: string;
      variant?: string;
      quantity: number;
    }
  ): Promise<ApiResponse<OrderDetail>> =>
    apiRequest<ApiResponse<OrderDetail>>(`/orders/${orderId}/details`, {
      method: "POST",
      body: JSON.stringify(detailData),
    }),

  updateOrderDetail: async (
    orderId: number,
    detailId: number,
    detailData: {
      sku: string;
      product_name: string;
      variant?: string;
      quantity: number;
    }
  ): Promise<ApiResponse<OrderDetail>> =>
    apiRequest<ApiResponse<OrderDetail>>(
      `/orders/${orderId}/details/${detailId}`,
      {
        method: "PUT",
        body: JSON.stringify(detailData),
      }
    ),

  deleteOrderDetail: async (
    orderId: number,
    detailId: number
  ): Promise<ApiResponse<void>> =>
    apiRequest<ApiResponse<void>>(`/orders/${orderId}/details/${detailId}`, {
      method: "DELETE",
    }),

  cancelOrder: async (id: number): Promise<ApiResponse<Order>> =>
    apiRequest<ApiResponse<Order>>(`/orders/${id}/cancel`, {
      method: "PUT",
    }),

  updateOrderToQcProcess: async (id: number): Promise<ApiResponse<Order>> =>
    apiRequest<ApiResponse<Order>>(`/orders/${id}/qc-process`, {
      method: "PUT",
    }),

  updateOrderToPickingCompleted: async (
    id: number
  ): Promise<ApiResponse<Order>> =>
    apiRequest<ApiResponse<Order>>(`/orders/${id}/picking-completed`, {
      method: "PUT",
    }),

  duplicateOrder: async (id: number): Promise<ApiResponse<Order>> =>
    apiRequest<ApiResponse<Order>>(`/orders/${id}/duplicate`, {
      method: "POST",
    }),
};
