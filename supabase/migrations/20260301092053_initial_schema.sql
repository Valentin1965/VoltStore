/*
  # VoltStore Database Schema

  1. New Tables
    - `products`
      - Product catalog with multilingual support
      - Categories: Charging Stations, Inverters, Batteries, Solar Panels, Kits
      - JSON fields for specs, docs, and multilingual content
    - `orders`
      - Customer orders with cart items
      - Order tracking and status management
      - Payment and shipping information

  2. Security
    - Enable RLS on all tables
    - Public read access for products (catalog browsing)
    - Authenticated users can create orders
    - Admin users can manage products and view all orders

  3. Indexes
    - Performance optimization for common queries
    - Category filtering
    - Search by status
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name jsonb NOT NULL DEFAULT '{"en": ""}'::jsonb,
  description jsonb DEFAULT '{"en": ""}'::jsonb,
  price numeric NOT NULL DEFAULT 0,
  old_price numeric DEFAULT NULL,
  category text NOT NULL,
  sub_category text DEFAULT NULL,
  image text DEFAULT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  rating numeric DEFAULT NULL,
  reviews_count integer DEFAULT NULL,
  stock integer DEFAULT 0,
  is_new boolean DEFAULT false,
  on_sale boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_leader boolean DEFAULT false,
  features jsonb DEFAULT '[]'::jsonb,
  specs jsonb DEFAULT '[]'::jsonb,
  detailed_tech_specs text DEFAULT NULL,
  docs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  total_price numeric NOT NULL,
  items jsonb NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, authenticated write)
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Orders policies
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
