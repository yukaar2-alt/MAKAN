import { AnalyticsReport, ChatMessage, EmailLog, Order, OrderStatus, Product } from "../types";

const API_BASE = "";

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to update product:", err);
    return null;
  }
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to create product:", err);
    return null;
  }
}

export async function verifyCashierPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/cashier/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error("Failed to verify PIN:", err);
    return false;
  }
}

export async function changeCashierPin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/cashier/change-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin, newPin }),
    });
    const json = await res.json();
    return { success: json.success, message: json.message || "" };
  } catch (err) {
    return { success: false, message: "Koneksi ke server gagal" };
  }
}

export async function fetchOrders(customerId?: string): Promise<Order[]> {
  try {
    const url = customerId
      ? `${API_BASE}/api/orders?customerId=${encodeURIComponent(customerId)}`
      : `${API_BASE}/api/orders`;
    const res = await fetch(url);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return [];
  }
}

export async function submitOrder(orderData: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  items: any[];
  totalAmount: number;
  tableNumber?: string;
  orderType: "dine_in" | "take_away";
  paymentProofUrl: string;
}): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Gagal membuat pesanan");
    }
    return json.data;
  } catch (err: any) {
    console.error("Failed to submit order:", err);
    throw err;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, cancelReason }),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to update order status:", err);
    return null;
  }
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error("Failed to delete order:", err);
    return false;
  }
}

export async function fetchAnalytics(): Promise<AnalyticsReport | null> {
  try {
    const res = await fetch(`${API_BASE}/api/reports/analytics`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
    return null;
  }
}

export async function fetchEmailLogs(): Promise<{ logs: EmailLog[]; adminEmail: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/emails`);
    const json = await res.json();
    return { logs: json.data || [], adminEmail: json.adminEmail || "ibeywy@gmail.com" };
  } catch (err) {
    return { logs: [], adminEmail: "ibeywy@gmail.com" };
  }
}

export async function sendTestAdminEmail(to?: string): Promise<EmailLog | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/emails/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
}

export async function sendReportPDFEmail(data: {
  to?: string;
  subject?: string;
  reportDate?: string;
  summaryText?: string;
  attachmentName?: string;
}): Promise<EmailLog | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/emails/send-report-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to send report PDF email:", err);
    return null;
  }
}

export async function sendStockAlertEmail(to?: string): Promise<EmailLog | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/emails/send-stock-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Failed to send stock alert email:", err);
    return null;
  }
}

export async function updateAdminEmailRecipient(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/emails/update-recipient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    return json.success;
  } catch (err) {
    return false;
  }
}

// --- Chat Service Methods ---
export async function fetchChatMessages(customerId?: string): Promise<ChatMessage[]> {
  try {
    const url = customerId
      ? `${API_BASE}/api/chat/messages?customerId=${encodeURIComponent(customerId)}`
      : `${API_BASE}/api/chat/messages`;
    const res = await fetch(url);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error("Failed to fetch chat messages:", err);
    return [];
  }
}

export async function sendChatMessage(messageData: {
  sender: "buyer" | "cashier";
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  message: string;
  orderNumber?: string;
}): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Gagal mengirim pesan");
    }
    return json.data;
  } catch (err) {
    console.error("Failed to send chat message:", err);
    throw err;
  }
}

export async function markChatAsRead(customerId: string, reader: "buyer" | "cashier"): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/chat/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, reader }),
    });
  } catch (err) {
    console.warn("Failed to mark chat as read:", err);
  }
}

// Subscribe to real-time events via Server-Sent Events (SSE)
export function subscribeToEvents(
  onNewOrder: (order: Order) => void,
  onOrderStatusUpdated: (order: Order) => void,
  onOrderDeleted: (data: { id: string }) => void,
  onStockUpdated: (products: Product[]) => void,
  onEmailNotification?: (log: EmailLog) => void,
  onChatMessage?: (msg: ChatMessage) => void,
  onChatRead?: (data: { customerId: string; reader: string }) => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`${API_BASE}/api/events`);

      eventSource.addEventListener("new_order", (e) => {
        try {
          const order = JSON.parse(e.data);
          onNewOrder(order);
        } catch {}
      });

      eventSource.addEventListener("order_status_updated", (e) => {
        try {
          const order = JSON.parse(e.data);
          onOrderStatusUpdated(order);
        } catch {}
      });

      eventSource.addEventListener("order_deleted", (e) => {
        try {
          const data = JSON.parse(e.data);
          onOrderDeleted(data);
        } catch {}
      });

      eventSource.addEventListener("stock_updated", (e) => {
        try {
          const products = JSON.parse(e.data);
          onStockUpdated(products);
        } catch {}
      });

      eventSource.addEventListener("product_updated", () => {
        fetchProducts().then(onStockUpdated);
      });

      eventSource.addEventListener("email_notification", (e) => {
        try {
          if (onEmailNotification) {
            const log = JSON.parse(e.data);
            onEmailNotification(log);
          }
        } catch {}
      });

      eventSource.addEventListener("chat_message", (e) => {
        try {
          if (onChatMessage) {
            const msg = JSON.parse(e.data);
            onChatMessage(msg);
          }
        } catch {}
      });

      eventSource.addEventListener("chat_read", (e) => {
        try {
          if (onChatRead) {
            const data = JSON.parse(e.data);
            onChatRead(data);
          }
        } catch {}
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Reconnect after 3s
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn("SSE connection error:", err);
      if (!isClosed) setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
