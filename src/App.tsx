import React, { useState, useEffect, useCallback } from "react";
import { GoogleUser, Product, CartItem, Order, OrderStatus, AnalyticsReport, ChatMessage } from "./types";
import {
  fetchProducts,
  fetchOrders,
  fetchAnalytics,
  submitOrder,
  updateOrderStatus,
  deleteOrder,
  updateProduct,
  createProduct,
  subscribeToEvents,
  fetchChatMessages,
} from "./services/api";
import { playCashierAlertChime, requestBrowserNotification } from "./utils/audio";
import { Header } from "./components/common/Header";
import { GoogleAuthGate } from "./components/buyer/GoogleAuthGate";
import { BuyerMenu } from "./components/buyer/BuyerMenu";
import { BuyerCart } from "./components/buyer/BuyerCart";
import { BuyerPaymentModal } from "./components/buyer/BuyerPaymentModal";
import { BuyerOrders } from "./components/buyer/BuyerOrders";
import { BuyerLiveChat } from "./components/buyer/BuyerLiveChat";
import { CashierPinModal } from "./components/cashier/CashierPinModal";
import { CashierLiveOrders } from "./components/cashier/CashierLiveOrders";
import { CashierStockManager } from "./components/cashier/CashierStockManager";
import { CashierReports } from "./components/cashier/CashierReports";
import { CashierEmailCenter } from "./components/cashier/CashierEmailCenter";
import { CashierLiveChat } from "./components/cashier/CashierLiveChat";
import {
  UtensilsCrossed,
  Receipt,
  Bell,
  Package,
  BarChart3,
  Mail,
  ChefHat,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

export default function App() {
  // App Mode: Buyer vs Cashier
  const [currentMode, setCurrentMode] = useState<"buyer" | "cashier">("buyer");

  // Buyer State
  const [buyerUser, setBuyerUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem("customer_google_auth");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [buyerActiveTab, setBuyerActiveTab] = useState<"menu" | "orders">("menu");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [checkoutOptions, setCheckoutOptions] = useState<{
    orderType: "dine_in" | "take_away";
    tableNumber?: string;
  }>({ orderType: "dine_in" });

  // Cashier State
  const [isCashierUnlocked, setIsCashierUnlocked] = useState<boolean>(false);
  const [cashierActiveTab, setCashierActiveTab] = useState<"orders" | "stock" | "reports" | "email" | "chat">("orders");
  const [selectedChatCustomerId, setSelectedChatCustomerId] = useState<string | undefined>(undefined);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState<boolean>(true);

  // Shared Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "info"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    const [prods, ords, an, chats] = await Promise.all([
      fetchProducts(),
      fetchOrders(),
      fetchAnalytics(),
      fetchChatMessages(),
    ]);
    setProducts(prods);
    setOrders(ords);
    setAnalytics(an);
    setChatMessages(chats);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Real-Time EventSource (SSE) Integration
  useEffect(() => {
    const unsubscribe = subscribeToEvents(
      // onNewOrder
      (newOrder: Order) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });

        // Trigger cashier alert sound & browser notification
        if (audioAlertEnabled) {
          playCashierAlertChime();
        }

        requestBrowserNotification(`Pesanan Baru: #${newOrder.orderNumber}`, {
          body: `Dari ${newOrder.customerName} (${newOrder.customerEmail}) senilai Rp ${newOrder.totalAmount.toLocaleString("id-ID")}`,
          icon: "/favicon.ico",
        });

        showToast(`Pesanan baru masuk: #${newOrder.orderNumber}`, "info");
        fetchAnalytics().then(setAnalytics);
      },
      // onOrderStatusUpdated
      (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        fetchAnalytics().then(setAnalytics);
      },
      // onOrderDeleted
      ({ id }) => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        fetchAnalytics().then(setAnalytics);
      },
      // onStockUpdated
      (updatedProducts: Product[]) => {
        setProducts(updatedProducts);
        fetchAnalytics().then(setAnalytics);
      },
      // onEmailNotification
      (log) => {
        showToast(`Email terkirim ke admin: ${log.subject.slice(0, 40)}...`, "info");
      },
      // onChatMessage
      (newMsg: ChatMessage) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender === "buyer") {
          if (audioAlertEnabled) {
            playCashierAlertChime();
          }
          requestBrowserNotification(`Chat dari ${newMsg.customerName}`, {
            body: newMsg.message,
            icon: "/favicon.ico",
          });
          showToast(`Chat dari ${newMsg.customerName}: "${newMsg.message.slice(0, 30)}..."`, "info");
        } else if (newMsg.sender === "cashier" && buyerUser && newMsg.customerId === buyerUser.googleId) {
          showToast(`Pesan dari Kasir: "${newMsg.message.slice(0, 35)}..."`, "info");
        }
      },
      // onChatRead
      ({ customerId, reader }) => {
        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.customerId === customerId) {
              if (reader === "cashier" && m.sender === "buyer") return { ...m, isRead: true };
              if (reader === "buyer" && m.sender === "cashier") return { ...m, isRead: true };
            }
            return m;
          })
        );
      }
    );

    return () => unsubscribe();
  }, [audioAlertEnabled, buyerUser]);

  // Buyer Google Login Handlers
  const handleBuyerLoginSuccess = (user: GoogleUser) => {
    setBuyerUser(user);
    try {
      localStorage.setItem("customer_google_auth", JSON.stringify(user));
    } catch {}
    showToast(`Selamat datang, ${user.name}!`, "success");
  };

  const handleBuyerLogout = () => {
    setBuyerUser(null);
    try {
      localStorage.removeItem("customer_google_auth");
    } catch {}
    setCartItems([]);
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity: number, notes?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.notes === notes
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
    showToast(`${quantity}x ${product.name} dimasukkan ke keranjang`, "success");
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
    }
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleProceedToPayment = (orderType: "dine_in" | "take_away", tableNumber?: string) => {
    setCheckoutOptions({ orderType, tableNumber });
    setIsPaymentModalOpen(true);
  };

  // Buyer Submits Order with mandatory QR payment proof
  const handleSubmitOrder = async (orderData: any) => {
    const newOrder = await submitOrder(orderData);
    if (newOrder) {
      setOrders((prev) => [newOrder, ...prev]);
      setCartItems([]);
      setIsPaymentModalOpen(false);
      setBuyerActiveTab("orders"); // Switch to order status tracker
      showToast("Pesanan berhasil dikirim ke kasir! Menunggu verifikasi bukti QRIS.", "success");
      // Fetch fresh products to reflect stock reduction
      fetchProducts().then(setProducts);
    }
  };

  // Cashier Handlers
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    cancelReason?: string
  ) => {
    const updated = await updateOrderStatus(orderId, status, cancelReason);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Status pesanan #${updated.orderNumber} berhasil diperbarui`, "success");
      fetchProducts().then(setProducts);
      fetchAnalytics().then(setAnalytics);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const success = await deleteOrder(orderId);
    if (success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast("Pesanan berhasil dihapus dari sistem kasir", "success");
      fetchAnalytics().then(setAnalytics);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await updateProduct(id, updates);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("Data barang & stok berhasil diperbarui", "success");
      fetchAnalytics().then(setAnalytics);
    }
  };

  const handleCreateProduct = async (newProd: Omit<Product, "id">) => {
    const created = await createProduct(newProd);
    if (created) {
      setProducts((prev) => [...prev, created]);
      showToast("Menu baru berhasil ditambahkan", "success");
      fetchAnalytics().then(setAnalytics);
    }
  };

  // Badge helpers
  const pendingOrdersCount = orders.filter(
    (o) => o.status === "MENUNGGU_KONFIRMASI"
  ).length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const cashierUnreadChatCount = chatMessages.filter(
    (m) => m.sender === "buyer" && !m.isRead
  ).length;
  const cartItemCounts = cartItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.product.id] = (acc[item.product.id] || 0) + item.quantity;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Application Header */}
      <Header
        currentMode={currentMode}
        onSwitchMode={(mode) => setCurrentMode(mode)}
        buyerUser={buyerUser}
        onBuyerLogout={handleBuyerLogout}
        isCashierUnlocked={isCashierUnlocked}
        onCashierLock={() => setIsCashierUnlocked(false)}
        pendingOrderCount={pendingOrdersCount}
        audioAlertEnabled={audioAlertEnabled}
        onToggleAudioAlert={() => setAudioAlertEnabled((prev) => !prev)}
        lowStockCount={lowStockCount}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold ${
              toastMessage.type === "success"
                ? "bg-slate-900 text-white border-emerald-500"
                : "bg-slate-900 text-white border-slate-700"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT ROUTING */}
      <main className="flex-1">
        {/* ================= MODE PEMBELI ================= */}
        {currentMode === "buyer" && (
          <>
            {!buyerUser ? (
              /* Mandatory Google Login Gate */
              <GoogleAuthGate onLoginSuccess={handleBuyerLoginSuccess} />
            ) : (
              /* Buyer Storefront */
              <div className="relative">
                {/* Secondary Sub-nav for Buyer */}
                <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-xs">
                  <div className="max-w-5xl mx-auto px-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 py-2">
                      <button
                        onClick={() => setBuyerActiveTab("menu")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          buyerActiveTab === "menu"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Daftar Menu</span>
                      </button>

                      <button
                        onClick={() => setBuyerActiveTab("orders")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          buyerActiveTab === "orders"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Pesanan Saya</span>
                        {orders.filter((o) => o.customerId === buyerUser.googleId).length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Pembayaran Resmi QRIS</span>
                    </div>
                  </div>
                </div>

                {/* Tab Views */}
                {buyerActiveTab === "menu" ? (
                  <>
                    <BuyerMenu
                      products={products}
                      onAddToCart={handleAddToCart}
                      cartItemCounts={cartItemCounts}
                    />
                    <BuyerCart
                      cartItems={cartItems}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onRemoveItem={handleRemoveCartItem}
                      onClearCart={handleClearCart}
                      onProceedToPayment={handleProceedToPayment}
                    />
                  </>
                ) : (
                  <BuyerOrders
                    buyerUser={buyerUser}
                    orders={orders}
                    onRefreshOrders={loadInitialData}
                  />
                )}

                {/* Floating Live Chat between Buyer and Cashier */}
                <BuyerLiveChat
                  buyerUser={buyerUser}
                  activeOrderNumber={
                    orders.find((o) => o.customerId === buyerUser.googleId)?.orderNumber
                  }
                  externalChatMessages={chatMessages}
                />

                {/* Mandatory QRIS Payment Modal with Proof Upload */}
                {isPaymentModalOpen && (
                  <BuyerPaymentModal
                    buyerUser={buyerUser}
                    cartItems={cartItems}
                    orderType={checkoutOptions.orderType}
                    tableNumber={checkoutOptions.tableNumber}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSubmitOrder={handleSubmitOrder}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ================= MODE KASIR (PIN PROTECTED) ================= */}
        {currentMode === "cashier" && (
          <>
            {!isCashierUnlocked ? (
              <CashierPinModal
                onUnlockSuccess={() => {
                  setIsCashierUnlocked(true);
                  showToast("Akses Kasir Terbuka", "success");
                }}
                onCancel={() => setCurrentMode("buyer")}
              />
            ) : (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-20">
                {/* Cashier Sub-navigation */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
                    <button
                      id="cashier-tab-orders-btn"
                      onClick={() => setCashierActiveTab("orders")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        cashierActiveTab === "orders"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <ChefHat className="w-4 h-4 text-emerald-400" />
                      <span>Pesanan Real-Time</span>
                      {pendingOrdersCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="cashier-tab-chat-btn"
                      onClick={() => setCashierActiveTab("chat")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        cashierActiveTab === "chat"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Live Chat</span>
                      {cashierUnreadChatCount > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                          {cashierUnreadChatCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="cashier-tab-stock-btn"
                      onClick={() => setCashierActiveTab("stock")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        cashierActiveTab === "stock"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Package className="w-4 h-4 text-amber-400" />
                      <span>Manajemen Stok</span>
                      {lowStockCount > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {lowStockCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="cashier-tab-reports-btn"
                      onClick={() => setCashierActiveTab("reports")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        cashierActiveTab === "reports"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span>Laporan & Analitik</span>
                    </button>

                    <button
                      id="cashier-tab-email-btn"
                      onClick={() => setCashierActiveTab("email")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        cashierActiveTab === "email"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span>Email Admin</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono hidden md:block">
                    Terminal Kasir Utama • ID Server: #POS-01
                  </div>
                </div>

                {/* Cashier Tab Contents */}
                {cashierActiveTab === "orders" && (
                  <CashierLiveOrders
                    orders={orders}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                    onOpenChatWithCustomer={(customerId) => {
                      setSelectedChatCustomerId(customerId);
                      setCashierActiveTab("chat");
                    }}
                  />
                )}

                {cashierActiveTab === "chat" && (
                  <CashierLiveChat
                    orders={orders}
                    externalChatMessages={chatMessages}
                    initialCustomerId={selectedChatCustomerId}
                  />
                )}

                {cashierActiveTab === "stock" && (
                  <CashierStockManager
                    products={products}
                    onUpdateProduct={handleUpdateProduct}
                    onCreateProduct={handleCreateProduct}
                  />
                )}

                {cashierActiveTab === "reports" && (
                  <CashierReports orders={orders} analytics={analytics} />
                )}

                {cashierActiveTab === "email" && <CashierEmailCenter />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
