
-- Enum for order status
CREATE TYPE public.order_status AS ENUM (
  'received', 'preparing', 'ready_pickup', 'out_for_delivery', 'completed'
);

-- Enum for payment method
CREATE TYPE public.payment_method AS ENUM ('pix', 'cash', 'card');

-- Enum for order type
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup');

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  has_stock_control BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  stock_minimum INTEGER DEFAULT 5,
  is_promo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Store settings (single row)
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Hortifruti da Família',
  logo_url TEXT,
  whatsapp_primary TEXT NOT NULL DEFAULT '+5522997639249',
  whatsapp_secondary TEXT NOT NULL DEFAULT '+5522998687200',
  active_whatsapp TEXT NOT NULL DEFAULT 'primary',
  delivery_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  delivery_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  opening_hours TEXT NOT NULL DEFAULT '07:00 - 19:00',
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage store settings" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  order_type public.order_type NOT NULL DEFAULT 'pickup',
  address TEXT,
  payment_method public.payment_method NOT NULL DEFAULT 'pix',
  needs_change BOOLEAN NOT NULL DEFAULT false,
  change_amount NUMERIC(10,2),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their order by id" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage order items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock logs
CREATE TABLE public.stock_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage stock logs" ON public.stock_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-mark product unavailable when stock reaches 0
CREATE OR REPLACE FUNCTION public.check_stock_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.has_stock_control AND NEW.stock_quantity <= 0 THEN
    NEW.available = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_product_stock BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.check_stock_availability();

-- Deduct stock when order status changes to 'preparing'
CREATE OR REPLACE FUNCTION public.deduct_stock_on_preparing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'preparing' AND NEW.status = 'preparing' THEN
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - oi.quantity::integer
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND p.has_stock_control = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER deduct_stock_on_order_preparing AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_preparing();

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Insert default store settings
INSERT INTO public.store_settings (store_name, whatsapp_primary, whatsapp_secondary, active_whatsapp, opening_hours, is_open)
VALUES ('Hortifruti da Família', '+5522997639249', '+5522998687200', 'primary', '07:00 - 19:00', true);

-- Insert default categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('Frutas', 1),
  ('Verduras', 2),
  ('Legumes', 3),
  ('Mercearia', 4),
  ('Rações / Pet', 5);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
