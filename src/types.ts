export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
  verifiedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  minStockAlert: number;
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderStatus =
  | "MENUNGGU_KONFIRMASI"
  | "DIPROSES"
  | "SELESAI"
  | "DIBATALKAN";

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string; // Isolated Google ID of the buyer
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  items: OrderItem[];
  totalAmount: number;
  tableNumber?: string;
  orderType: "dine_in" | "take_away";
  status: OrderStatus;
  paymentMethod: "QRIS";
  paymentProofUrl: string;
  paymentProofTimestamp?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

export interface AnalyticsReport {
  todayRevenue: number;
  todayOrderCount: number;
  monthlyRevenue: number;
  monthlyOrderCount: number;
  totalOrdersCount: number;
  pendingCount: number;
  lowStockItems: Product[];
  categorySales: Record<string, number>;
  topItems: { name: string; count: number; revenue: number }[];
  adminEmail: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: "new_order" | "low_stock" | "payment_confirmed" | "pdf_report";
  sentAt: string;
  status: "sent" | "simulated";
  attachmentName?: string;
}

export type ReceiptPaperSize = "58mm" | "80mm";

export interface PrinterSettings {
  autoPrintOnConfirm: boolean;
  autoPrintOnNewOrder: boolean;
  paperSize: ReceiptPaperSize;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  footerMessage: string;
}

export interface ChatMessage {
  id: string;
  sender: "buyer" | "cashier";
  customerId: string; // Google User ID
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  message: string;
  timestamp: string;
  orderNumber?: string;
  isRead?: boolean;
}

export interface PaymentQRConfig {
  imageUrl: string;
  merchantName: string;
  merchantCity: string;
  nmid: string;
  terminal: string;
  printerCode: string;
  useCustomImage: boolean;
  updatedAt: string;
}
