export interface BoxesCountReportDetail {
  tracking: string;
  order_ginee_id: string;
  box_name: string;
  quantity: number;
  qc_by: number;
  username: string;
  full_name: string;
  created_at: string;
  source: string;
}

export interface BoxesCountReport {
  box_id: number;
  box_code: string;
  box_name: string;
  total_count: number;
  ribbon_count: number;
  online_count: number;
  details: BoxesCountReportDetail[];
}

export interface BoxesCountReportPagination {
  page: number;
  limit: number;
  total: number;
}

export interface BoxesCountReportResponse {
  success: boolean;
  message: string;
  data: {
    reports: BoxesCountReport[];
    pagination: BoxesCountReportPagination;
  };
}

export interface OutboundReport {
  id: number;
  tracking: string;
  outbound_by: number;
  expedition: string;
  expedition_color: string;
  expedition_slug: string;
  complained: boolean;
  created_at: string;
  updated_at: string;
  outbound_operator: OutboundReportUser;
}

export interface OutboundReportUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: OutboundReportUserRole[];
}

export interface OutboundReportUserRole {
  id: number;
  name: string;
  description: string;
  assigned_by: string;
  assigned_at: string;
}

export interface OutboundReportResponse {
  success: boolean;
  message: string;
  data: {
    outbounds: OutboundReport[];
    total: number;
  };
}
