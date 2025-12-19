// Product interface
export interface Product {
  id: number;
  sku: string;
  name: string;
  image: string;
  variant: string;
  location: string;
  barcode: string;
  created_at: string;
  updated_at: string;
}

// Order Detail interface
export interface OrderDetail {
  id: number;
  sku: string;
  product_name: string;
  variant: string;
  quantity: number;
  price: number;
}

// Role interface
export interface Role {
  id: number;
  name: string;
  description: string;
  assigned_by: string;
  assigned_at: string;
}

// Picker (User) interface
export interface Picker {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

// Order interface
export interface Order {
  id: number;
  order_ginee_id: string;
  processing_status: string;
  event_status: string | null;
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
  order_details: OrderDetail[];
}

// Pick Order Detail interface
export interface PickedOrderDetail {
  id: number;
  picked_order_id: number;
  sku: string;
  product_name: string;
  variant: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: Product;
}

// Pick Order interface
export interface PickedOrder {
  id: number;
  order_id: number;
  picked_by: number;
  created_at: string;
  updated_at: string;
  order: Order;
  picker: Picker;
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// Pick Order Response interface
export interface PickedOrderResponse {
  success: boolean;
  message: string;
  data: {
    pick_orders: PickedOrder[];
    pagination: Pagination;
  };
}
