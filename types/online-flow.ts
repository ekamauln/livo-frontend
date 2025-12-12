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
  assigned_by?: OnlineFlowOperator;
  assigned_at?: string;
  picked_by?: OnlineFlowOperator;
  picked_at?: string;
  pending_by?: OnlineFlowOperator;
  pending_at?: string;
  changed_by?: OnlineFlowOperator;
  changed_at?: string;
  cancelled_by?: OnlineFlowOperator;
  cancelled_at?: string;
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
