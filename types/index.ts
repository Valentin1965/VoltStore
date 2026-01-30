
export enum AppView {
  CATALOG = 'catalog',
  CART = 'cart',
  CHECKOUT = 'checkout',
  ADMIN = 'admin',
  CALCULATOR = 'calculator',
  WISHLIST = 'wishlist',
  COMPARE = 'compare',
  ABOUT = 'about',
  CABINET = 'cabinet'
}

export type Category = 'Charging Stations' | 'Inverters' | 'Batteries' | 'Solar Panels' | 'Kits';

export interface ProductDoc {
  title: string;
  url: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Alternative {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface KitComponent {
  id: string;
  name: string;
  price: number;
  quantity: number;
  alternatives: Alternative[];
}

export type LocalizedText = string | Record<string, string>;

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  price: number;
  old_price?: number | null;
  category: Category;
  sub_category?: string | null;
  image: string | null;
  images?: string[] | null;
  rating?: number | null;
  reviews_count?: number | null;
  stock?: number | null;
  is_new?: boolean | null;
  on_sale?: boolean | null;
  is_active?: boolean | null;
  is_leader?: boolean | null;
  features?: string[] | null;
  specs?: string | null; 
  detailed_tech_specs?: string | null;
  docs?: string | null;
  kitComponents?: KitComponent[]; 
  created_at?: string;
}

export interface KitPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
  parts?: KitPart[];
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  department: string;
  total_price: number;
  items: CartItem[];
  payment_method: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface UserStats {
  energyGenerated: number;
  co2Saved: number;
  independenceScore: number;
}
