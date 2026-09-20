import React, { useState } from "react";
import { Order, OrderStatus, ReceiptPaperSize } from "../../types";
import { formatRupiah, formatDate } from "../../utils/export";
import { printReceipt } from "../../utils/printReceipt";
import { ReceiptModal } from "../common/ReceiptModal";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  ChefHat,
  XCircle,
  QrCode,
  X,
  ExternalLink,
  ShieldCheck,
  Search,
  MessageSquare,
  Printer,
  Sparkles,
} from "lucide-react";

interface CashierLiveOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, cancelReason?: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onOpenChatWithCustomer?: (customerId: string) => void;
}

export const CashierLiveOrders: React.FC<CashierLiveOrdersProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onOpenChatWithCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<"SEMUA" | OrderStatus>("MENUNGGU_KONFIRMASI");
  const [selectedProofUrl, setSelectedProofUrl] = useState<{ url: string; orderNumber: string } | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem("cashier_auto_print") !== "false";
  });
  const [printSuccessToast, setPrintSuccessToast] = useState<string | null>(null);

  const handleToggleAutoPrint = (val: boolean) => {
    setAutoPrintEnabled(val);
    localStorage.setItem("cashier_auto_print", val ? "true" : "false");
  };

  // Tab badge counts
  const pendingCount = orders.filter((o) => o.status === "MENUNGGU_KONFIRMASI").length;
  const processingCount = orders.filter((o) => o.status === "DIPROSES").length;
  const completedCount = orders.filter((o) => o.status === "SELESAI").length;
  const cancelledCount = orders.filter((o) => o.status === "DIBATALKAN").length;

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === "SEMUA" || o.status === activeTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleConfirmPayment = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await onUpdateStatus(orderId, "DIPROSES");
      
      // Automatic receipt printing to connected cashier printer
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder && autoPrintEnabled) {
        const paperSize = (localStorage.getItem("cashier_paper_size") as ReceiptPaperSize) || "58mm";
        printReceipt(targetOrder, { paperSize });
        setPrintSuccessToast(`Struk #${targetOrder.orderNumber} otomatis tercetak ke printer kasir!`);
        setTimeout(() => setPrintSuccessToast(null), 4500);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDirectPrintOrder = async (order: Order) => {
    const paperSize = (localStorage.getItem("cashier_paper_size") as ReceiptPaperSize) || "58mm";
    await printReceipt(order, { paperSize });
    setPrintSuccessToast(`Perintah cetak struk #${order.orderNumber} dikirim ke printer kasir!`);
    setTimeout(() => setPrintSuccessToast(null), 4000);
  };

  const handleCompleteOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await onUpdateStatus(orderId, "SELESAI");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelReasonInput("Bukti pembayaran tidak sesuai atau nominal kurang");
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setActionLoadingId(cancelModalOrder.id);
    try {
      await onUpdateStatus(
        cancelModalOrder.id,
        "DIBATALKAN",
        cancelReasonInput.trim() || "Dibatalkan oleh kasir"
      );
      setCancelModalOrder(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen dari daftar kasir?")) {
      setActionLoadingId(orderId);
      try {
        await onDeleteOrder(orderId);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-Print Thermal Notification Bar */}
      <div className="bg-emerald-950 text-white rounded-2xl p-3.5 px-4 shadow-sm border border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Pencetakan Struk Otomatis ke Printer Kasir
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  autoPrintEnabled
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {autoPrintEnabled ? "Aktif (Auto-Print ON)" : "Nonaktif"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              Saat kasir mengonfirmasi pesanan, struk thermal kasir (58mm / 80mm) akan langsung otomatis terkirim ke printer terhubung tanpa repot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleToggleAutoPrint(!autoPrintEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              autoPrintEnabled
                ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{autoPrintEnabled ? "Auto-Print Aktif" : "Aktifkan Auto-Print"}</span>
          </button>
        </div>
      </div>

      {printSuccessToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{printSuccessToast}</span>
          </div>
          <button
            onClick={() => setPrintSuccessToast(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("MENUNGGU_KONFIRMASI")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "MENUNGGU_KONFIRMASI"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Perlu Konfirmasi</span>
            {pendingCount > 0 && (
              <span className="bg-white text-amber-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("DIPROSES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "DIPROSES"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Diproses Dapur</span>
            <span className="text-[10px] opacity-75">({processingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("SELESAI")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "SELESAI"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
            <span className="text-[10px] opacity-75">({completedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("DIBATALKAN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "DIBATALKAN"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Dibatalkan</span>
            <span className="text-[10px] opacity-75">({cancelledCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("SEMUA")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "SEMUA"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>Semua ({orders.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <input
            type="text"
            placeholder="Cari no. order / nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Tidak Ada Pesanan</h4>
          <p className="text-xs text-slate-400 mt-1">
            Tidak ada transaksi pada tab status ini saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isWaiting = order.status === "MENUNGGU_KONFIRMASI";
            const isProcessing = order.status === "DIPROSES";
            const isCompleted = order.status === "SELESAI";
            const isCancelled = order.status === "DIBATALKAN";
            const canDelete = isCompleted || isCancelled; // As requested: "bisa menghapus pesanan yang sudah selesai di batalkan"
            const isLoading = actionLoadingId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                  isWaiting
                    ? "border-amber-300 ring-2 ring-amber-400/20"
                    : isProcessing
                    ? "border-blue-200"
                    : "border-slate-200"
                }`}
              >
                {/* Header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {order.customerAvatar ? (
                      <img
                        src={order.customerAvatar}
                        alt={order.customerName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {order.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{order.customerEmail}</span>
                        <span>•</span>
                        <span>ID Google: <span className="font-mono">{order.customerId.slice(0, 10)}...</span></span>
                        <span>•</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                      {order.orderType === "dine_in"
                        ? `Dine In (${order.tableNumber || "Meja 1"})`
                        : "Bungkus (Take Away)"}
                    </span>

                    {/* Status Pill */}
                    {isWaiting && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu Verifikasi</span>
                      </span>
                    )}
                    {isProcessing && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white flex items-center gap-1">
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Diproses Dapur</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dibatalkan</span>
                      </span>
                    )}

                    <button
                      onClick={() => setReceiptModalOrder(order)}
                      title="Cetak Struk Thermal (58mm / 80mm)"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-700" />
                      <span className="hidden sm:inline">Struk</span>
                    </button>

                    {onOpenChatWithCustomer && (
                      <button
                        onClick={() => onOpenChatWithCustomer(order.customerId)}
                        title="Buka Chat dengan Pembeli"
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items & Payment Info */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: Items list */}
                  <div className="md:col-span-2 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rincian Menu Pesanan ({order.items.length} macam)
                    </span>
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-xs py-0.5">
                          <div>
                            <span className="font-bold text-slate-900 mr-1.5">
                              {item.quantity}x
                            </span>
                            <span className="text-slate-800 font-medium">
                              {item.productName}
                            </span>
                            {item.notes && (
                              <span className="block text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 border border-amber-200">
                                Catatan: {item.notes}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-700 shrink-0 ml-2">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.cancelReason && (
                      <div className="p-2.5 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 mt-2">
                        <span className="font-bold">Alasan Dibatalkan:</span> {order.cancelReason}
                      </div>
                    )}
                  </div>

                  {/* Right: Payment QRIS & Proof Viewer */}
                  <div className="flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pembayaran QRIS & Bukti
                      </span>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Metode QRIS</span>
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>

                      {/* Transaction proof button with thumbnail */}
                      <div className="mt-2">
                        <button
                          id={`view-proof-btn-${order.id}`}
                          onClick={() =>
                            setSelectedProofUrl({
                              url: order.paymentProofUrl,
                              orderNumber: order.orderNumber,
                            })
                          }
                          className="w-full p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2.5 text-left transition-colors group"
                        >
                          <img
                            src={order.paymentProofUrl}
                            alt="Bukti Transfer"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-300 group-hover:border-emerald-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1">
                              <span>Periksa Bukti Transfer</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Klik untuk perbesar foto struk
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons for Cashier */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      {isWaiting && (
                        <>
                          <button
                            id={`confirm-order-btn-${order.id}`}
                            disabled={isLoading}
                            onClick={() => handleConfirmPayment(order.id)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Konfirmasi Bayar</span>
                          </button>
                          <button
                            id={`cancel-order-btn-${order.id}`}
                            disabled={isLoading}
                            onClick={() => handleOpenCancelModal(order)}
                            className="py-2 px-3 bg-slate-100 hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold rounded-xl transition-all"
                          >
                            Tolak
                          </button>
                        </>
                      )}

                      {isProcessing && (
                        <>
                          <button
                            id={`complete-order-btn-${order.id}`}
                            disabled={isLoading}
                            onClick={() => handleCompleteOrder(order.id)}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selesaikan Pesanan</span>
                          </button>
                          <button
                            onClick={() => handleDirectPrintOrder(order)}
                            title="Cetak struk ke printer"
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleOpenCancelModal(order)}
                            className="py-2 px-3 text-slate-500 hover:text-red-600 text-xs font-semibold rounded-xl"
                          >
                            Batalkan
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => handleDirectPrintOrder(order)}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Cetak Ulang Struk Kasir</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          id={`delete-order-btn-${order.id}`}
                          disabled={isLoading}
                          onClick={() => handleDelete(order.id)}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Pesanan Selesai / Dibatalkan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Inspection Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Verifikasi Struk QRIS: #{selectedProofUrl.orderNumber}
                </h4>
                <p className="text-xs text-slate-500">
                  Periksa tanggal, jam, nominal, dan status berhasil transfer.
                </p>
              </div>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-2 max-h-96 overflow-auto">
              <img
                src={selectedProofUrl.url}
                alt="Bukti Transfer Detail"
                className="w-full object-contain rounded-lg mx-auto"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <a
                href={selectedProofUrl.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Buka Ukuran Penuh</span>
              </a>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order with Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Batalkan Pesanan #{cancelModalOrder.orderNumber}</h4>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Pesanan ini akan dibatalkan dan persediaan stok akan dikembalikan secara otomatis.
            </p>

            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Pembatalan untuk Pembeli
            </label>
            <textarea
              rows={3}
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="w-1/2 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Ya, Batalkan Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Thermal Receipt Printing Modal */}
      {receiptModalOrder && (
        <ReceiptModal
          order={receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}
    </div>
  );
};
