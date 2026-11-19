export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fabric_label: string | null;
  technique: string | null;
  stitch_count: number | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  size_stock: Record<string, number>;
  stock: number;
  /** Lower numbers appear first; 0 means unspecified (newest first). */
  sort_order: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_published: boolean;
  is_customisable: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  slug: string | null;
  image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  embroidery_text: string | null;
  placement: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_method: "razorpay" | "cod" | "bank_transfer";
  payment_status: PaymentStatus;
  proof_preference: "digital" | "trust_artisan";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type CustomRequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "approved"
  | "in_production"
  | "completed"
  | "declined";

export type CustomRequest = {
  id: string;
  request_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  garment_name: string | null;
  garment_id: string | null;
  size: string | null;
  color: string | null;
  custom_text: string | null;
  font_style: string | null;
  thread_color: string | null;
  placement: string | null;
  description: string | null;
  reference_images: string[];
  status: CustomRequestStatus;
  quote_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreSettings = {
  id: number;
  brand_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  instagram: string | null;
  shipping_fee: number;
  free_shipping_threshold: number;
  announcement: string | null;
  cod_enabled: boolean;
  updated_at: string;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  embroideryText?: string;
  placement?: string;
};
