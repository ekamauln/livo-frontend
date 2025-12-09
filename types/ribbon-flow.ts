export interface RibbonFlowOperator {
  id: number;
  username: string;
  full_name: string;
}

export interface RibbonFlowQcRibbon {
  operator: RibbonFlowOperator;
  created_at: string;
}

export interface RibbonFlowOutbound {
  operator: RibbonFlowOperator;
  expedition: string;
  expedition_color: string;
  created_at: string;
}

export interface RibbonFlowOrder {
  tracking: string;
  processing_status: string;
  order_ginee_id: string;
  complained: boolean;
  created_at: string;
}

export interface RibbonFlow {
  tracking: string;
  qc_ribbon?: RibbonFlowQcRibbon;
  outbound?: RibbonFlowOutbound;
  order: RibbonFlowOrder;
}

export interface RibbonFlowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
