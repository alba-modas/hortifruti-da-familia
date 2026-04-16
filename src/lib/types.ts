export interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category_id: string;
  image_url?: string | null;
  available: boolean;
  has_stock_control: boolean;
  stock_quantity?: number | null;
  stock_minimum?: number | null;
  is_promo: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderData {
  customer_name: string;
  order_type: 'delivery' | 'pickup';
  address?: string;
  payment_method: 'pix' | 'cash' | 'card';
  needs_change?: boolean;
  change_amount?: number;
  items: { product_id: string; product_name: string; quantity: number; price: number; unit: string }[];
  total: number;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  logo_url?: string | null;
  whatsapp_primary: string;
  whatsapp_secondary: string;
  active_whatsapp: 'primary' | 'secondary';
  delivery_fee_enabled: boolean;
  delivery_fee_amount: number;
  opening_hours: string;
  is_open: boolean;
}
