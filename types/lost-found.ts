export interface LostFound {
  id: number;
  product_sku: string;
  quantity: number;
  reason: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  user?: {
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
