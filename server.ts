import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Product {
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

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
  totalAmount: number;
  tableNumber?: string;
  orderType: "dine_in" | "take_away";
  status: "MENUNGGU_KONFIRMASI" | "DIPROSES" | "SELESAI" | "DIBATALKAN";
  paymentMethod: "QRIS";
  paymentProofUrl: string;
  paymentProofTimestamp?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: "new_order" | "low_stock" | "payment_confirmed" | "pdf_report" | "test_admin";
  sentAt: string;
  status: "sent" | "simulated";
  attachmentName?: string;
}

interface ChatMessage {
  id: string;
  sender: "buyer" | "cashier";
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  message: string;
  timestamp: string;
  orderNumber?: string;
  isRead: boolean;
}

// Initial In-Memory State
let products: Product[] = [
  {
    id: "p-1",
    name: "Nasi Goreng Spesial Telur Ceplok",
    description: "Nasi goreng racikan bumbu khas Nusantara dengan suwiran ayam, sosis, bakso, acar, dan telur ceplok setengah matang.",
    price: 28000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    stock: 24,
    minStockAlert: 5,
    isAvailable: true,
  },
  {
    id: "p-2",
    name: "Ayam Geprek Krispi Sambal Bawang",
    description: "Ayam goreng tepung renyah diulek dengan sambal bawang pedas nampol khas Jawa, disajikan hangat.",
    price: 25000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    stock: 4, // Menipis untuk demonstrasi fitur notifikasi stok otomatis!
    minStockAlert: 5,
    isAvailable: true,
  },
  {
    id: "p-3",
    name: "Mie Goreng Jawa Nyemek",
    description: "Mie telur kuning dengan bumbu kecap manis legit, udang segar, caisim, kol, dan taburan bawang goreng renyah.",
    price: 24000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
    stock: 18,
    minStockAlert: 5,
    isAvailable: true,
  },
  {
    id: "p-4",
    name: "Es Kopi Susu Gula Aren",
    description: "Espresso robusta & arabika premium blend dengan susu murni segar dan sirup gula aren organik.",
    price: 18000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    stock: 35,
    minStockAlert: 8,
    isAvailable: true,
  },
  {
    id: "p-5",
    name: "Es Teh Manis Melati Jumbo",
    description: "Seduhan teh melati wangi khas Solo dengan es batu kristal higienis dan gula tebu asli.",
    price: 8000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    minStockAlert: 10,
    isAvailable: true,
  },
  {
    id: "p-6",
    name: "Matcha Latte Oat Milk Dingin",
    description: "Green tea Uji Matcha autentik berpadu dengan gurihnya susu oat plant-based yang creamy.",
    price: 26000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    stock: 3, // Menipis
    minStockAlert: 5,
    isAvailable: true,
  },
  {
    id: "p-7",
    name: "Dimsum Ayam Udang Mentai (4 pcs)",
    description: "Dimsum homemade daging ayam dan udang padat dengan saus mentai bakar gurih creamy.",
    price: 22000,
    category: "Snack & Cemilan",
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80",
    stock: 15,
    minStockAlert: 5,
    isAvailable: true,
  },
  {
    id: "p-8",
    name: "Kentang Goreng Truffle Cheese",
    description: "Shoestring french fries renyah bertabur bubuk keju cheddar dan aroma minyak jamur truffle.",
    price: 19000,
    category: "Snack & Cemilan",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    stock: 12,
    minStockAlert: 5,
    isAvailable: true,
  },
];

let orders: Order[] = [];
let emailLogs: EmailLog[] = [];
let chatMessages: ChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "cashier",
    customerId: "all",
    customerName: "Kasir Toko",
    customerEmail: "kasir@warungkafe.com",
    message: "Halo! Selamat datang di MAKAN SANTAI. Ada yang bisa kami bantu seputar menu atau pesanan Anda?",
    timestamp: new Date().toISOString(),
    isRead: true,
  },
];
let cashierPin = "200310";
let currentAdminEmail = "ibeywy@gmail.com";

interface PaymentQRConfig {
  imageUrl: string;
  merchantName: string;
  merchantCity: string;
  nmid: string;
  terminal: string;
  printerCode: string;
  useCustomImage: boolean;
  updatedAt: string;
}

const defaultPaymentQR: PaymentQRConfig = {
  imageUrl: "/qris_makan_santai.jpg",
  merchantName: "MAKAN SANTAI, KBYRN LM",
  merchantCity: "KBYRN LM",
  nmid: "ID1026597604283",
  terminal: "A01",
  printerCode: "93600914",
  useCustomImage: true,
  updatedAt: new Date().toISOString(),
};

let paymentQRConfig: PaymentQRConfig = { ...defaultPaymentQR };

// Server-Sent Events subscribers for real-time cashier notifications
type SSESubscriber = (event: string, data: any) => void;
const sseClients: Set<SSESubscriber> = new Set();

function broadcastEvent(event: string, data: any) {
  sseClients.forEach((client) => {
    try {
      client(event, data);
    } catch {
      // client disconnected
    }
  });
}

function sendAdminEmail(
  type: EmailLog["type"],
  subject: string,
  body: string,
  recipient: string = currentAdminEmail,
  attachmentName?: string
) {
  const log: EmailLog = {
    id: "email-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    to: recipient || currentAdminEmail,
    subject,
    body,
    type,
    sentAt: new Date().toISOString(),
    status: "sent",
    attachmentName,
  };
  emailLogs.unshift(log);
  if (emailLogs.length > 80) emailLogs.pop();
  console.log(`[EMAIL DISPATCHED TO ${log.to}]`, subject);
  broadcastEvent("email_notification", log);
  return log;
}

// Check stock levels and trigger warning email if low
function checkStockAlerts(product: Product) {
  if (product.stock <= product.minStockAlert) {
    sendAdminEmail(
      "low_stock",
      `⚠️ PERINGATAN: Persediaan Stok Barang Hampir Habis (${product.name})`,
      `Halo Admin,\n\nPersediaan barang "${product.name}" saat ini tersisa ${product.stock} unit (Batas minimum: ${product.minStockAlert} unit).\nSegera lakukan pengisian ulang inventaris (restock) agar pelayanan pelanggan tidak terganggu.\n\nSistem Pemesanan Online & Kasir.`
    );
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "30mb" })); // Support base64 upload of payment receipts & QR codes
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get products
  app.get("/api/products", (_req, res) => {
    res.json({ success: true, data: products });
  });

  // Update product / stock
  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }
    const updated = { ...products[index], ...req.body };
    products[index] = updated;

    // Check if stock is low
    if (req.body.stock !== undefined) {
      checkStockAlerts(updated);
    }

    broadcastEvent("product_updated", updated);
    res.json({ success: true, data: updated });
  });

  // Add new product
  app.post("/api/products", (req, res) => {
    const newProduct: Product = {
      id: "p-" + Date.now(),
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price) || 0,
      category: req.body.category || "Makanan Utama",
      image: req.body.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      stock: Number(req.body.stock) || 0,
      minStockAlert: Number(req.body.minStockAlert) || 5,
      isAvailable: req.body.isAvailable !== false,
    };
    products.push(newProduct);
    broadcastEvent("product_added", newProduct);
    res.json({ success: true, data: newProduct });
  });

  // Verify / Change Cashier PIN
  app.post("/api/cashier/verify-pin", (req, res) => {
    const { pin } = req.body;
    if (pin === cashierPin) {
      res.json({ success: true, message: "PIN Kasir Valid" });
    } else {
      res.status(401).json({ success: false, message: "PIN Kasir Salah" });
    }
  });

  app.post("/api/cashier/change-pin", (req, res) => {
    const { currentPin, newPin } = req.body;
    if (currentPin !== cashierPin) {
      return res.status(401).json({ success: false, message: "PIN Saat Ini Salah" });
    }
    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ success: false, message: "PIN Baru Minimal 4 Digit" });
    }
    cashierPin = newPin;
    res.json({ success: true, message: "PIN Kasir Berhasil Diperbarui" });
  });

  // --- Payment QRIS Configuration Routes ---
  app.get("/api/payment-qr", (_req, res) => {
    res.json({ success: true, data: paymentQRConfig });
  });

  app.post("/api/payment-qr", (req, res) => {
    const {
      imageUrl,
      merchantName,
      merchantCity,
      nmid,
      terminal,
      printerCode,
      useCustomImage,
    } = req.body;

    paymentQRConfig = {
      ...paymentQRConfig,
      imageUrl: imageUrl !== undefined ? imageUrl : paymentQRConfig.imageUrl,
      merchantName: merchantName !== undefined ? merchantName : paymentQRConfig.merchantName,
      merchantCity: merchantCity !== undefined ? merchantCity : paymentQRConfig.merchantCity,
      nmid: nmid !== undefined ? nmid : paymentQRConfig.nmid,
      terminal: terminal !== undefined ? terminal : paymentQRConfig.terminal,
      printerCode: printerCode !== undefined ? printerCode : paymentQRConfig.printerCode,
      useCustomImage: useCustomImage !== undefined ? Boolean(useCustomImage) : paymentQRConfig.useCustomImage,
      updatedAt: new Date().toISOString(),
    };

    broadcastEvent("payment_qr_updated", paymentQRConfig);
    res.json({
      success: true,
      data: paymentQRConfig,
      message: "QRIS Pembayaran berhasil diperbarui dan diterapkan ke semua pelanggan",
    });
  });

  app.post("/api/payment-qr/reset", (_req, res) => {
    paymentQRConfig = {
      ...defaultPaymentQR,
      updatedAt: new Date().toISOString(),
    };
    broadcastEvent("payment_qr_updated", paymentQRConfig);
    res.json({
      success: true,
      data: paymentQRConfig,
      message: "Foto dan konfigurasi QRIS berhasil dikembalikan ke standar awal",
    });
  });

  // Get orders (optional filter by customerId for Buyer isolation)
  app.get("/api/orders", (req, res) => {
    const { customerId } = req.query;
    if (customerId && typeof customerId === "string") {
      const userOrders = orders.filter((o) => o.customerId === customerId);
      return res.json({ success: true, data: userOrders });
    }
    res.json({ success: true, data: orders });
  });

  // Create new order (Buyer submits with mandatory QR payment proof)
  app.post("/api/orders", (req, res) => {
    const { customerId, customerName, customerEmail, customerAvatar, items, totalAmount, tableNumber, orderType, paymentProofUrl } = req.body;

    if (!customerId || !customerEmail) {
      return res.status(400).json({ success: false, message: "Login Google pembeli wajib disertakan" });
    }

    if (!paymentProofUrl) {
      return res.status(400).json({ success: false, message: "Bukti transaksi pembayaran QRIS wajib dilampirkan" });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Keranjang belanja tidak boleh kosong" });
    }

    // Auto deduct stock & check alerts
    items.forEach((item: any) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        checkStockAlerts(prod);
      }
    });

    const orderNumber = "ORD-" + new Date().getFullYear().toString().slice(-2) +
      String(new Date().getMonth() + 1).padStart(2, "0") +
      String(new Date().getDate()).padStart(2, "0") + "-" +
      Math.floor(1000 + Math.random() * 9000);

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: "ord-" + Date.now(),
      orderNumber,
      customerId,
      customerName: customerName || "Pelanggan Google",
      customerEmail,
      customerAvatar,
      items,
      totalAmount,
      tableNumber: tableNumber || "-",
      orderType: orderType || "dine_in",
      status: "MENUNGGU_KONFIRMASI",
      paymentMethod: "QRIS",
      paymentProofUrl,
      paymentProofTimestamp: now,
      createdAt: now,
      updatedAt: now,
    };

    orders.unshift(newOrder);

    // Broadcast in real-time to Cashier terminal
    broadcastEvent("new_order", newOrder);
    broadcastEvent("stock_updated", products);

    // Dispatch automatic email to Admin
    sendAdminEmail(
      "new_order",
      `🔔 PESANAN BARU MASUK: ${orderNumber} - Rp ${totalAmount.toLocaleString("id-ID")}`,
      `Halo Admin Kasir,\n\nPesanan baru #${orderNumber} telah diterima dari ${customerName} (${customerEmail}).\nTotal Pembayaran: Rp ${totalAmount.toLocaleString("id-ID")}\nMetode: QRIS (Bukti Pembayaran Sudah Diunggah).\n\nSegera buka dashboard Kasir untuk memverifikasi bukti transaksi dan mengonfirmasi pesanan.`
    );

    res.json({ success: true, data: newOrder });
  });

  // Cashier updates order status: Confirm, Process, Complete, Cancel
  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    const order = orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;

    if (status === "DIPROSES") {
      order.confirmedAt = now;
      // Send email notification on payment confirmed
      sendAdminEmail(
        "payment_confirmed",
        `✅ PEMBAYARAN DIKONFIRMASI: #${order.orderNumber} Berhasil Diverifikasi`,
        `Halo Admin,\n\nPembayaran QRIS untuk pesanan #${order.orderNumber} senilai Rp ${order.totalAmount.toLocaleString("id-ID")} telah berhasil dikonfirmasi oleh kasir.\nPesanan saat ini sedang diproses di dapur.`
      );
    } else if (status === "SELESAI") {
      order.completedAt = now;
    } else if (status === "DIBATALKAN") {
      order.cancelReason = cancelReason || "Dibatalkan oleh kasir";
      // Return stock if cancelled
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
        }
      });
      broadcastEvent("stock_updated", products);
    }

    broadcastEvent("order_status_updated", order);
    res.json({ success: true, data: order });
  });

  // Cashier deletes order: "bisa menghapus pesanan yang sudah selesai di batalkan"
  app.delete("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    const targetOrder = orders[orderIndex];
    if (targetOrder.status !== "SELESAI" && targetOrder.status !== "DIBATALKAN") {
      return res.status(400).json({
        success: false,
        message: "Hanya pesanan dengan status Selesai atau Dibatalkan yang dapat dihapus dari sistem",
      });
    }

    orders.splice(orderIndex, 1);
    broadcastEvent("order_deleted", { id });
    res.json({ success: true, message: "Pesanan berhasil dihapus" });
  });

  // Reporting and Analytics
  app.get("/api/reports/analytics", (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const confirmedOrders = orders.filter((o) => o.status === "DIPROSES" || o.status === "SELESAI");

    // Daily revenue
    const todayOrders = confirmedOrders.filter((o) => o.createdAt.startsWith(today));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Monthly revenue (current month)
    const currentMonth = today.slice(0, 7);
    const monthOrders = confirmedOrders.filter((o) => o.createdAt.startsWith(currentMonth));
    const monthlyRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Sales by category
    const categorySales: Record<string, number> = {};
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || "Lainnya";
        categorySales[cat] = (categorySales[cat] || 0) + item.price * item.quantity;
      });
    });

    // Top selling items
    const itemSales: Record<string, { name: string; count: number; revenue: number }> = {};
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemSales[item.productId]) {
          itemSales[item.productId] = { name: item.productName, count: 0, revenue: 0 };
        }
        itemSales[item.productId].count += item.quantity;
        itemSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.values(itemSales).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      success: true,
      data: {
        todayRevenue,
        todayOrderCount: todayOrders.length,
        monthlyRevenue,
        monthlyOrderCount: monthOrders.length,
        totalOrdersCount: orders.length,
        pendingCount: orders.filter((o) => o.status === "MENUNGGU_KONFIRMASI").length,
        lowStockItems: products.filter((p) => p.stock <= p.minStockAlert),
        categorySales,
        topItems,
        adminEmail: currentAdminEmail,
      },
    });
  });

  // Email notifications log & manual test trigger
  app.get("/api/admin/emails", (_req, res) => {
    res.json({ success: true, data: emailLogs, adminEmail: currentAdminEmail });
  });

  app.post("/api/admin/emails/update-recipient", (req, res) => {
    const { email } = req.body;
    if (email && email.includes("@")) {
      currentAdminEmail = email.trim();
      return res.json({ success: true, adminEmail: currentAdminEmail, message: "Email penerima berhasil diperbarui" });
    }
    res.status(400).json({ success: false, message: "Format email tidak valid" });
  });

  app.post("/api/admin/emails/test", (req, res) => {
    const { to = currentAdminEmail, subject, body } = req.body;
    const log = sendAdminEmail(
      "new_order",
      subject || `[TEST NOTIFIKASI] Uji Coba Pengiriman Email Kasir ke Admin`,
      body || `Ini adalah pesan konfirmasi bahwa notifikasi email otomatis ke admin (${to}) berfungsi dengan sempurna.`,
      to
    );
    res.json({ success: true, data: log });
  });

  // Dispatch PDF Sales & Finance Report directly to email
  app.post("/api/admin/emails/send-report-pdf", (req, res) => {
    const { to = currentAdminEmail, subject, reportDate, summaryText, attachmentName } = req.body;
    const dateStr = reportDate || new Date().toISOString().slice(0, 10);
    const finalSubject =
      subject || `📑 LAPORAN PENJUALAN PDF (${dateStr}) - Warung & Kafe Nusantara`;
    const finalBody =
      summaryText ||
      `Halo Admin,\n\nBerikut terlampir rangkuman Laporan Keuangan & Penjualan Resmi untuk periode ${dateStr}.\n\nLaporan ini dibuat otomatis oleh Sistem Kasir Digital Warung & Kafe Nusantara dan telah dikirimkan ke alamat email terdaftar: ${to}.\n\nSilakan cek lampiran berkas PDF (${attachmentName || "Laporan_Kasir.pdf"}) atau unduh langsung dari dashboard kasir.`;

    const log = sendAdminEmail("pdf_report", finalSubject, finalBody, to, attachmentName || `Laporan_Kasir_${dateStr}.pdf`);
    res.json({ success: true, data: log, message: `Laporan PDF berhasil dikirim ke ${to}` });
  });

  // Dispatch Low-Stock alert recap directly to email
  app.post("/api/admin/emails/send-stock-alert", (req, res) => {
    const { to = currentAdminEmail } = req.body;
    const lowStock = products.filter((p) => p.stock <= p.minStockAlert);

    let body = `Halo Admin,\n\nBerikut adalah rekap status persediaan barang/menu yang saat ini berada di bawah batas minimum stok:\n\n`;
    if (lowStock.length === 0) {
      body += `✅ Seluruh produk saat ini dalam kondisi stok aman (tidak ada barang menipis).\n`;
    } else {
      lowStock.forEach((p, idx) => {
        body += `${idx + 1}. [${p.category}] ${p.name}\n   - Stok Tersisa: ${p.stock} unit\n   - Batas Minimum: ${p.minStockAlert} unit\n   - Status: ${p.stock === 0 ? "HABIS (OUT OF STOCK)" : "MENIPIS"}\n\n`;
      });
      body += `Mohon segera lakukan pembelian atau pengisian ulang inventaris (restock) ke supplier.\n\nSistem Inventaris Kasir Otomatis.`;
    }

    const subject = `⚠️ [REKAP STOK MENIPIS] ${lowStock.length} Menu Perlu Restock Segera`;
    const log = sendAdminEmail("low_stock", subject, body, to);
    res.json({ success: true, data: log, message: `Notifikasi stok berhasil dikirim ke ${to}` });
  });

  // --- LIVE CHAT API ROUTES (Pembeli & Kasir) ---
  app.get("/api/chat/messages", (req, res) => {
    const { customerId } = req.query;
    if (customerId && typeof customerId === "string") {
      const userMessages = chatMessages.filter(
        (m) => m.customerId === customerId || m.customerId === "all"
      );
      return res.json({ success: true, data: userMessages });
    }
    // Return all messages for cashier
    res.json({ success: true, data: chatMessages });
  });

  app.post("/api/chat/messages", (req, res) => {
    const {
      sender = "buyer",
      customerId,
      customerName = "Pelanggan",
      customerEmail = "",
      customerAvatar,
      message,
      orderNumber,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Pesan tidak boleh kosong" });
    }

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID wajib disertakan" });
    }

    const newMessage: ChatMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      sender,
      customerId,
      customerName,
      customerEmail,
      customerAvatar,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      orderNumber,
      isRead: false,
    };

    chatMessages.push(newMessage);
    // Keep max 500 messages in memory
    if (chatMessages.length > 500) {
      chatMessages = chatMessages.slice(-500);
    }

    // Broadcast to SSE clients in real-time
    broadcastEvent("chat_message", newMessage);

    res.json({ success: true, data: newMessage });
  });

  app.patch("/api/chat/read", (req, res) => {
    const { customerId, reader } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID wajib" });
    }

    chatMessages.forEach((m) => {
      if (m.customerId === customerId) {
        if (reader === "cashier" && m.sender === "buyer") {
          m.isRead = true;
        } else if (reader === "buyer" && m.sender === "cashier") {
          m.isRead = true;
        }
      }
    });

    broadcastEvent("chat_read", { customerId, reader });
    res.json({ success: true });
  });

  // Real-Time SSE Stream for Cashier
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientHandler = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sseClients.add(clientHandler);
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    req.on("close", () => {
      sseClients.delete(clientHandler);
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pemesanan Online & Kasir server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
