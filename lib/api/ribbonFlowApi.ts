import { RibbonFlow } from "@/types/ribbon-flow";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const ribbonFlowApi = {
  getRibbonFlows: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<RibbonFlow>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    const url = `/ribbons/ribbon-flows?${params.toString()}`;
    console.log("Ribbon Flow API URL:", url); // Debug log

    return apiRequest<PaginatedResponse<RibbonFlow>>(url);
  },

  getRibbonFlowById: async (
    tracking: string
  ): Promise<ApiResponse<RibbonFlow>> => {
    return apiRequest<ApiResponse<RibbonFlow>>(
      `/ribbons/ribbon-flows/${tracking}`
    );
  },
};
