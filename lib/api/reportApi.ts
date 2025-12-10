import {
  OutboundReportResponse,
  BoxesCountReportResponse,
} from "@/types/report";
import { apiRequest } from "@/lib/api/types";

export const reportApi = {
  getBoxesCountReports: async (
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
    search?: string
  ): Promise<BoxesCountReportResponse> => {
    const params = new URLSearchParams();

    // Add pagination parameters
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    // Add date range parameters
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    // Add search parameter if provided
    if (search) params.append("search", search);

    const queryString = params.toString();
    const endpoint = `/reports/boxes-count${
      queryString ? `?${queryString}` : ""
    }`;

    return apiRequest<BoxesCountReportResponse>(endpoint);
  },

  getOutboundReports: async (
    date?: string,
    search?: string,
    expeditionSlug?: string
  ): Promise<OutboundReportResponse> => {
    const params = new URLSearchParams();

    // Use expedition slug as search parameter (backend expects 'search' for expedition filtering)
    const searchQuery = expeditionSlug || search;

    // Add search parameter if provided
    if (searchQuery) params.append("search", searchQuery);

    // Add date parameter if provided
    if (date) params.append("date", date);

    const queryString = params.toString();
    const endpoint = `/reports/handout-outbounds${
      queryString ? `?${queryString}` : ""
    }`;

    return apiRequest<OutboundReportResponse>(endpoint);
  },
};
