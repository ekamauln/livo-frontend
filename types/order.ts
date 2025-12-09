export interface OrderDetail {
  id: number;
  sku: string;
  product_name: string;
  variant?: string;
  quantity: number;
  price: number;
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

export interface Order {
  id: number;
  order_ginee_id: string;
  processing_status: string;
  event_status?: string;
  channel: string;
  store: string;
  buyer: string;
  address: string;
  tracking: string;
  courier: string;
  sent_before: string;
  created_at: string;
  updated_at: string;
  assigned_by?: string;
  assigned_at?: string;
  picked_by?: string;
  picked_at?: string;
  changed_by?: string;
  changed_at?: string;
  pending_by?: string;
  pending_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  order_details: OrderDetail[];
  "No."?: string | number; // Keep for Excel import compatibility
}

// Types for Excel import
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export type CellValue = string | number | boolean | null | undefined;
export type ExcelRow = { [key: string]: JsonValue };
export type WorksheetData = (string | number | boolean | null | undefined)[][];

export interface OrdersData {
  orders: Order[];
}

// Additional types for order table and pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}
