export interface OnlineFlowOperator {
  id: number;
  username: string;
  full_name: string;
}

export interface OnlineFlowQcOnline {
  operator: OnlineFlowOperator;
  created_at: string;
}

export interface OnlineFlowOutbound {
  operator: OnlineFlowOperator;
  expedition: string;
  expedition_color: string;
  created_at: string;
}

export interface OnlineFlowOrder {
  tracking: string;
  processing_status: string;
  order_ginee_id: string;
  complained: boolean;
  created_at: string;
}

export interface OnlineFlow {
  tracking: string;
  qc_online?: OnlineFlowQcOnline;
  outbound?: OnlineFlowOutbound;
  order: OnlineFlowOrder;
}

export interface OnlineFlowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
