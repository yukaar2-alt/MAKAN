import React, { useState } from "react";
import { GoogleUser, Order } from "../../types";
import { formatRupiah, formatDate } from "../../utils/export";
import { Clock, CheckCircle2, AlertCircle, ChefHat, Eye, X, Receipt, ShoppingBag } from "lucide-react";

interface BuyerOrdersProps {
  buyerUser: GoogleUser;
  orders: Order[];
  onRefreshOrders: () => void;
}

export const BuyerOrders: React.FC<BuyerOrdersProps> = ({
  buyerUser,
  orders,
}) => {
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Strictly filter only orders belonging to this user's Google ID!
  const myOrders = orders.filter((o) => o.customerId === buyerUser.googleId);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Riwayat & Status Pesanan Saya</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ID Akun Google: <span className="font-mono text-slate-700 font-medium">{buyerUser.googleId}</span>
          </p>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Pesanan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Anda belum melakukan pemesanan. Pilih menu favorit Anda dan selesaikan pembayaran via QRIS.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => {
            const isWaiting = order.status === "MENUNGGU_KONFIRMASI";
            const isProcessing = order.status === "DIPROSES";
            const isCompleted = order.status === "SELESAI";
            const isCancelled = order.status === "DIBATALKAN";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Nomor Transaksi
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isWaiting && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Menunggu Verifikasi Kasir</span>
                      </span>
                    )}
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dikonfirmasi • Sedang Disiapkan</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pesanan Selesai</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Pesanan Dibatalkan</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Explanation Banner */}
                {isWaiting && (
                  <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Bukti transfer QRIS Anda sedang diteliti oleh kasir. Pesanan akan segera diproses begitu kasir menekan tombol konfirmasi.
                    </span>
                  </div>
                )}

                {isCancelled && order.cancelReason && (
                  <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Alasan Kasir Membatalkan:</span> {order.cancelReason}
                    </div>
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="p-4 divide-y divide-slate-100">
                  <div className="space-y-2 pb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="text-slate-800">
                          <span className="font-bold text-slate-900">{item.quantity}x</span>{" "}
                          <span>{item.productName}</span>
                          {item.notes && (
                            <span className="block text-[11px] text-slate-500 italic pl-5">
                              Catatan: {item.notes}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Proof */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {order.orderType === "dine_in"
                          ? `Dine In (${order.tableNumber || "Meja 1"})`
                          : "Bungkus (Take Away)"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(order.paymentProofUrl)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti QRIS</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">Total Bayar (QRIS)</span>
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-800">
                Bukti Transaksi QRIS Diunggah
              </span>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedProofUrl}
              alt="Bukti Transaksi"
              className="max-h-80 w-full object-contain rounded-lg border border-slate-200 bg-slate-50"
            />
            <div className="mt-3 text-right">
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
