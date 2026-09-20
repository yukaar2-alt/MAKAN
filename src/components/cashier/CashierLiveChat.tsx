import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Order } from "../../types";
import { fetchChatMessages, sendChatMessage, markChatAsRead } from "../../services/api";
import { formatRupiah } from "../../utils/export";
import {
  MessageSquare,
  Send,
  User,
  Store,
  CheckCheck,
  Check,
  Search,
  Sparkles,
  Receipt,
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Copy,
  CheckCircle,
  Users,
  Utensils,
  Filter,
  ShieldCheck,
} from "lucide-react";

interface CashierLiveChatProps {
  orders: Order[];
  externalChatMessages?: ChatMessage[];
  initialCustomerId?: string;
}

export const CashierLiveChat: React.FC<CashierLiveChatProps> = ({
  orders,
  externalChatMessages,
  initialCustomerId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomerId || null
  );
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "unread" | "with_order">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick reply presets for Cashier
  const cashierPresets = [
    "Siap kak! Pesanan sedang diproses di dapur.",
    "Pembayaran QRIS sudah terverifikasi. Terima kasih!",
    "Pesanan Anda sudah selesai dan siap diambil/disajikan.",
    "Baik kak, request tambahan sudah kami sampaikan ke dapur.",
    "Bisa tolong kirimkan foto bukti transfer yang lebih jelas kak?",
  ];

  // Load chat messages on mount
  useEffect(() => {
    loadAllMessages();
  }, []);

  // Update when external SSE messages come in
  useEffect(() => {
    if (externalChatMessages && externalChatMessages.length > 0) {
      setMessages(externalChatMessages);
    }
  }, [externalChatMessages]);

  // Sync initialCustomerId when prop updates
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const loadAllMessages = async () => {
    try {
      const data = await fetchChatMessages();
      setMessages(data);

      // Auto-select first customer if none selected and on desktop
      if (!selectedCustomerId && data.length > 0) {
        const customerIds = Array.from(
          new Set(data.map((m) => m.customerId).filter((id) => id !== "all"))
        );
        if (customerIds.length > 0 && window.innerWidth >= 768) {
          setSelectedCustomerId(customerIds[0]);
        }
      }
    } catch (err) {
      console.error("Gagal memuat pesan chat kasir:", err);
    }
  };

  // Group messages by customer with full sender profiles
  const customerMap = new Map<
    string,
    {
      customerId: string;
      customerName: string;
      customerEmail: string;
      customerAvatar?: string;
      lastMessage: ChatMessage;
      unreadCount: number;
      messages: ChatMessage[];
      order?: Order;
    }
  >();

  messages.forEach((msg) => {
    if (msg.customerId === "all") return;
    const existing = customerMap.get(msg.customerId);
    if (!existing) {
      // Find latest order for this customer
      const userOrders = orders
        .filter((o) => o.customerId === msg.customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const userOrder = userOrders[0];

      customerMap.set(msg.customerId, {
        customerId: msg.customerId,
        customerName: msg.customerName || "Pelanggan",
        customerEmail: msg.customerEmail || "",
        customerAvatar: msg.customerAvatar,
        lastMessage: msg,
        unreadCount: msg.sender === "buyer" && !msg.isRead ? 1 : 0,
        messages: [msg],
        order: userOrder,
      });
    } else {
      existing.messages.push(msg);
      // Keep most detailed sender info if available
      if (!existing.customerAvatar && msg.customerAvatar) {
        existing.customerAvatar = msg.customerAvatar;
      }
      if ((!existing.customerEmail || existing.customerEmail === "") && msg.customerEmail) {
        existing.customerEmail = msg.customerEmail;
      }
      if (existing.customerName === "Pelanggan" && msg.customerName) {
        existing.customerName = msg.customerName;
      }

      if (new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        existing.lastMessage = msg;
      }
      if (msg.sender === "buyer" && !msg.isRead) {
        existing.unreadCount += 1;
      }
    }
  });

  const customerList = Array.from(customerMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  );

  const totalUnreadCount = customerList.reduce((acc, c) => acc + c.unreadCount, 0);
  const withOrderCount = customerList.filter((c) => !!c.order).length;

  const filteredCustomerList = customerList.filter((c) => {
    // Tab filtering
    if (activeTabFilter === "unread" && c.unreadCount === 0) return false;
    if (activeTabFilter === "with_order" && !c.order) return false;

    // Search query filtering
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerEmail.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q) ||
      (c.order && c.order.orderNumber.toLowerCase().includes(q)) ||
      (c.order && c.order.tableNumber && c.order.tableNumber.toLowerCase().includes(q)) ||
      c.lastMessage.message.toLowerCase().includes(q)
    );
  });

  // Mark as read when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      markChatAsRead(selectedCustomerId, "cashier");
      scrollToBottom();
    }
  }, [selectedCustomerId]);

  const activeCustomer = selectedCustomerId ? customerMap.get(selectedCustomerId) : null;
  const activeMessages = activeCustomer ? activeCustomer.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedCustomerId || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const activeCust = customerMap.get(selectedCustomerId);
      const newMsg = await sendChatMessage({
        sender: "cashier",
        customerId: selectedCustomerId,
        customerName: "Kasir Toko",
        customerEmail: "kasir@warungkafe.com",
        message: text,
        orderNumber: activeCust?.order?.orderNumber,
      });

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Gagal mengirim pesan kasir:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px]">
      {/* LEFT SIDEBAR: Sender Directory / Customer List */}
      <div
        className={`w-full md:w-88 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
          selectedCustomerId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header & Search */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 leading-tight">Daftar Pengirim Chat</h3>
                <span className="text-[11px] text-slate-500">
                  {customerList.length} pembeli terhubung
                </span>
              </div>
            </div>
            <button
              onClick={loadAllMessages}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Perbarui Obrolan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2">
            <input
              id="search-customer-chat-input"
              type="text"
              placeholder="Cari nama, email, order, atau ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setActiveTabFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeTabFilter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({customerList.length})
            </button>
            <button
              onClick={() => setActiveTabFilter("unread")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTabFilter === "unread"
                  ? "bg-red-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Belum Dibaca</span>
              {totalUnreadCount > 0 && (
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                    activeTabFilter === "unread" ? "bg-white text-red-600" : "bg-red-500 text-white"
                  }`}
                >
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTabFilter("with_order")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeTabFilter === "with_order"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ada Pesanan ({withOrderCount})
            </button>
          </div>
        </div>

        {/* Sender List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredCustomerList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada pengirim ditemukan</p>
              <p className="text-[11px] mt-0.5 text-slate-500">
                Pesan dari pembeli akan otomatis menampilkan nama dan email akun Google di sini.
              </p>
            </div>
          ) : (
            filteredCustomerList.map((customer) => {
              const isSelected = selectedCustomerId === customer.customerId;
              const hasOrder = !!customer.order;
              const lastIsCashier = customer.lastMessage.sender === "cashier";

              return (
                <button
                  key={customer.customerId}
                  onClick={() => setSelectedCustomerId(customer.customerId)}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-emerald-50/90 border-l-4 border-emerald-600"
                      : "hover:bg-slate-100/70 bg-white/70"
                  }`}
                >
                  {/* Sender Avatar with Google Status Indicator */}
                  <div className="relative shrink-0 mt-0.5">
                    {customer.customerAvatar ? (
                      <img
                        src={customer.customerAvatar}
                        alt={customer.customerName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {customer.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Verified Google Icon */}
                    <span
                      title="Akun Google Terverifikasi"
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-slate-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </span>

                    {/* Unread Pill Badge */}
                    {customer.unreadCount > 0 && (
                      <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-white animate-bounce">
                        {customer.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Sender Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {customer.customerName}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-1">
                        {formatTime(customer.lastMessage.timestamp)}
                      </span>
                    </div>

                    {/* Email and Google ID */}
                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {customer.customerEmail || "Akun Google"}
                    </p>

                    {/* Connected Order Badge */}
                    {hasOrder && customer.order && (
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          <Receipt className="w-2.5 h-2.5 text-slate-500" />
                          #{customer.order.orderNumber}
                        </span>

                        {customer.order.tableNumber ? (
                          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            Meja {customer.order.tableNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            Bungkus
                          </span>
                        )}

                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            customer.order.status === "SELESAI"
                              ? "bg-emerald-100 text-emerald-800"
                              : customer.order.status === "DIPROSES"
                              ? "bg-blue-100 text-blue-800"
                              : customer.order.status === "DIBATALKAN"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {customer.order.status}
                        </span>
                      </div>
                    )}

                    {/* Last Message Preview with Sender Tag */}
                    <div className="text-xs truncate">
                      {lastIsCashier ? (
                        <span className="text-slate-400 font-normal">Anda: </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          {customer.customerName.split(" ")[0]}:{" "}
                        </span>
                      )}
                      <span
                        className={
                          customer.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-500"
                        }
                      >
                        {customer.lastMessage.message}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Active Chat Conversation & Detailed Sender Profile */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          selectedCustomerId ? "flex" : "hidden md:flex"
        }`}
      >
        {activeCustomer ? (
          <>
            {/* Conversation Header: Full Sender Profile */}
            <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Kembali ke Daftar Pengirim"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  {activeCustomer.customerAvatar ? (
                    <img
                      src={activeCustomer.customerAvatar}
                      alt={activeCustomer.customerName}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {activeCustomer.customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* Identity Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
                      {activeCustomer.customerName}
                    </h4>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Google Terverifikasi
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mt-0.5">
                    <span className="font-medium text-slate-600">{activeCustomer.customerEmail}</span>
                    <span>•</span>
                    <button
                      onClick={() => handleCopyId(activeCustomer.customerId)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-200/80 hover:bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded transition-colors"
                      title="Salin Google ID Pembeli"
                    >
                      <span className="truncate max-w-[120px]">ID: {activeCustomer.customerId}</span>
                      {copiedId === activeCustomer.customerId ? (
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Context Card */}
              {activeCustomer.order && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
                      Pesanan #{activeCustomer.order.orderNumber}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(activeCustomer.order.totalAmount)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeCustomer.order.status === "SELESAI"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeCustomer.order.status === "DIPROSES"
                        ? "bg-blue-100 text-blue-800"
                        : activeCustomer.order.status === "DIBATALKAN"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {activeCustomer.order.status}
                  </span>

                  {activeCustomer.order.tableNumber && (
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      Meja {activeCustomer.order.tableNumber}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Message Stream with Prominent Sender Headers */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {activeMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <p>Belum ada riwayat pesan dengan {activeCustomer.customerName}.</p>
                  <p className="mt-1 text-[11px]">Ketik pesan di bawah atau pilih template balasan cepat.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isCashier = msg.sender === "cashier";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCashier ? "items-end" : "items-start"}`}
                    >
                      {/* Sender Header Label */}
                      <div
                        className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${
                          isCashier ? "flex-row-reverse text-slate-500" : "text-slate-600"
                        }`}
                      >
                        <span className="font-bold text-slate-900">
                          {isCashier ? "Kasir Toko (Anda)" : msg.customerName || activeCustomer.customerName}
                        </span>

                        {!isCashier && (msg.customerEmail || activeCustomer.customerEmail) && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            ({msg.customerEmail || activeCustomer.customerEmail})
                          </span>
                        )}

                        {msg.orderNumber && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                            Pesanan #{msg.orderNumber}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Bubble with Avatar */}
                      <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[78%]">
                        {!isCashier && (
                          <div className="relative shrink-0 mb-1">
                            {msg.customerAvatar || activeCustomer.customerAvatar ? (
                              <img
                                src={msg.customerAvatar || activeCustomer.customerAvatar}
                                alt={msg.customerName}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                                {(msg.customerName || activeCustomer.customerName).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-2xs ${
                            isCashier
                              ? "bg-slate-900 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs"
                          }`}
                        >
                          <p>{msg.message}</p>

                          {/* Footer Info inside bubble */}
                          <div
                            className={`text-[10px] mt-2 flex items-center justify-between gap-3 pt-1 border-t ${
                              isCashier ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
                            }`}
                          >
                            <span className="text-[9px] font-medium">
                              {isCashier
                                ? "Terkirim dari Kasir"
                                : `Pengirim: ${msg.customerName || activeCustomer.customerName}`}
                            </span>

                            <div className="flex items-center gap-1 font-mono">
                              <span>{formatTime(msg.timestamp)}</span>
                              {isCashier && (
                                <span>
                                  {msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Presets */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Template:
              </span>
              {cashierPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset)}
                  className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] rounded-full transition-colors shrink-0"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                id="cashier-reply-chat-input"
                type="text"
                placeholder={`Balas pesan ${activeCustomer.customerName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
              <button
                id="cashier-send-chat-btn"
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  !inputText.trim() || isSending
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-slate-700">Pilih Percakapan Pembeli</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Pilih salah satu pembeli di daftar sebelah kiri untuk melihat rincian identitas akun dan membalas pesan secara real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
