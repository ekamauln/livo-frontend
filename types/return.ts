export interface Return {
  id: number;
  new_tracking: string;
  old_tracking: string;
  order_ginee_id: string;
  channel_id: number;
  store_id: number;
  return_type: string;
  return_reason: string;
  return_number: string;
  scrap_number: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  details?: ReturnDetails[];
  return_details?: ReturnDetails[];
  create_operator?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles: Array<{
      id: number;
      name: string;
      description: string;
      assigned_by: string;
      assigned_at: string;
    }>;
  };
  update_operator?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles: Array<{
      id: number;
      name: string;
      description: string;
      assigned_by: string;
      assigned_at: string;
    }>;
  };
  channel?: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  store?: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  order?: {
    id: number;
    order_ginee_id: string;
    processing_status: string;
    event_status: string;
    channel: string;
    store: string;
    buyer: string;
    address: string;
    courier: string;
    tracking: string;
    sent_before: string;
    complained: boolean;
    assigned_by: string;
    assigned_at: string;
    picked_by: string;
    picked_at: string;
    pending_by: string;
    pending_at: string;
    changed_by: string;
    changed_at: string;
    cancelled_by: string;
    cancelled_at: string;
    created_at: string;
    updated_at: string;
    order_details: Array<{
      id: number;
      sku: string;
      product_name: string;
      variant: string;
      quantity: number;
      price: number;
    }>;
  };
}

export interface ReturnDetails {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    sku: string;
    name: string;
    image: string;
    variant: string;
    location: string;
    barcode: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateReturn {
  new_tracking: string;
  old_tracking: string;
  channel_id: number;
  store_id: number;
  return_type: string;
  return_reason: string;
  return_number?: string;
  scrap_number?: string;
}

export interface UpdateReturn {
  old_tracking: string;
  return_type: string;
  return_reason: string;
  return_number?: string;
  scrap_number?: string;
}
