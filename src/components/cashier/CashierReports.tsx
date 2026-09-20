import React, { useState } from "react";
import { Order, AnalyticsReport } from "../../types";
import { formatRupiah, formatDate, exportOrdersToPDF, exportOrdersToExcel } from "../../utils/export";
import { sendReportPDFEmail } from "../../services/api";
import {
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Calendar,
  DollarSign,
  ShoppingBag,
  Award,
  BarChart3,
  PieChart,
  CheckCircle2,
  Clock,
  ChevronRight,
  Mail,
  Send,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface CashierReportsProps {
  orders: Order[];
  analytics: AnalyticsReport | null;
}

export const CashierReports: React.FC<CashierReportsProps> = ({ orders, analytics }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [recipientEmail, setRecipientEmail] = useState<string>("ibeywy@gmail.com");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  const confirmedOrders = orders.filter(
    (o) => o.status === "DIPROSES" || o.status === "SELESAI"
  );

  // Orders filtered by selected date
  const filteredDailyOrders = orders.filter((o) =>
    o.createdAt.startsWith(selectedDate)
  );
  const dailyConfirmedOrders = filteredDailyOrders.filter(
    (o) => o.status === "DIPROSES" || o.status === "SELESAI"
  );
  const dailyRevenue = dailyConfirmedOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );
  const dailyAverageTicket =
    dailyConfirmedOrders.length > 0
      ? Math.round(dailyRevenue / dailyConfirmedOrders.length)
      : 0;

  // Monthly metrics (current month)
  const currentMonthStr = selectedDate.slice(0, 7);
  const monthlyConfirmedOrders = confirmedOrders.filter((o) =>
    o.createdAt.startsWith(currentMonthStr)
  );
  const monthlyRevenue = monthlyConfirmedOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );

  // Daily distribution for the month
  const daysInMonthMap: Record<string, { count: number; revenue: number }> = {};
  monthlyConfirmedOrders.forEach((o) => {
    const day = o.createdAt.slice(8, 10);
    if (!daysInMonthMap[day]) {
      daysInMonthMap[day] = { count: 0, revenue: 0 };
    }
    daysInMonthMap[day].count += 1;
    daysInMonthMap[day].revenue += o.totalAmount;
  });

  const maxDayRevenue = Math.max(
    ...Object.values(daysInMonthMap).map((d) => d.revenue),
    1
  );

  const handleExportPDF = () => {
    const exportData = filteredDailyOrders.length > 0 ? filteredDailyOrders : orders;
    exportOrdersToPDF(
      exportData,
      `Laporan Pendapatan Kasir (${selectedDate})`
    );
  };

  const handleExportExcel = () => {
    const exportData = filteredDailyOrders.length > 0 ? filteredDailyOrders : orders;
    exportOrdersToExcel(
      exportData,
      `Laporan_Keuangan_Kasir_${selectedDate}`
    );
  };

  const handleSendPDFToEmail = async () => {
    setIsSendingEmail(true);
    setEmailSuccessMsg(null);
    try {
      const exportData = filteredDailyOrders.length > 0 ? filteredDailyOrders : orders;
      const validOrders = exportData.filter((o) => o.status !== "DIBATALKAN");
      const rev = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      const summary = `Halo Admin,\n\nBerikut terlampir rangkuman Laporan Penjualan & Keuangan Periode: ${selectedDate}\n\n` +
        `• Tanggal Laporan : ${selectedDate}\n` +
        `• Total Omset/Pendapatan Sah : ${formatRupiah(rev)}\n` +
        `• Total Transaksi : ${validOrders.length} pesanan\n` +
        `• Pesanan Selesai : ${exportData.filter((o) => o.status === "SELESAI").length}\n` +
        `• Pesanan Dibatalkan : ${exportData.filter((o) => o.status === "DIBATALKAN").length}\n\n` +
        `Laporan ini telah diarsip di server kasir dan siap diunduh dalam format PDF resmi.\n\nSistem Kasir Digital MAKAN SANTAI.`;

      const result = await sendReportPDFEmail({
        to: recipientEmail,
        subject: `📑 [LAPORAN PENJUALAN PDF] ${selectedDate} - Total: ${formatRupiah(rev)}`,
        reportDate: selectedDate,
        summaryText: summary,
        attachmentName: `Laporan_Kasir_${selectedDate}.pdf`,
      });

      if (result) {
        setEmailSuccessMsg(`Laporan PDF periode ${selectedDate} berhasil dikirim ke ${recipientEmail}!`);
        // Also auto trigger download for convenience
        handleExportPDF();
        setTimeout(() => setEmailSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingEmail(false);
      setIsEmailModalOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Date Filter & Export Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Pilih Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
          />
        </div>

        {/* Export & Email Dispatch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="send-pdf-email-btn"
            disabled={isSendingEmail}
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title={`Kirim laporan PDF ke ${recipientEmail}`}
          >
            {isSendingEmail ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-white" />
            )}
            <span>Kirim PDF ke Email ({recipientEmail})</span>
          </button>

          <button
            id="export-pdf-report-btn"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            title="Download Laporan PDF Resmi"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>Ekspor PDF</span>
          </button>

          <button
            id="export-excel-report-btn"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            title="Download Spreadsheet Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {emailSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{emailSuccessMsg}</span>
          </div>
          <button
            onClick={() => setEmailSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Modal Konfirmasi Kirim PDF ke Email */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kirim Laporan Penjualan PDF via Email
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan tanggal <span className="font-bold text-slate-700">{selectedDate}</span> akan dikirim ke alamat email tujuan.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Email Penerima:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="contoh: ibeywy@gmail.com"
                />
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Periode Tanggal:</span>
                  <span className="font-bold text-slate-800">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Omset:</span>
                  <span className="font-bold text-emerald-600">{formatRupiah(dailyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Pesanan:</span>
                  <span className="font-bold text-slate-800">{dailyConfirmedOrders.length} transaksi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                disabled={isSendingEmail || !recipientEmail}
                onClick={handleSendPDFToEmail}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Pendapatan Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Pendapatan Hari Terpilih
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(dailyRevenue)}
            </span>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{dailyConfirmedOrders.length} transaksi QRIS berhasil</span>
            </p>
          </div>
        </div>

        {/* Card 2: Rata-Rata Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Rata-Rata per Transaksi
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(dailyAverageTicket)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nilai keranjang rata-rata hari ini
            </p>
          </div>
        </div>

        {/* Card 3: Pendapatan Bulanan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Total Pendapatan Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-purple-700 tracking-tight">
              {formatRupiah(monthlyRevenue)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {monthlyConfirmedOrders.length} transaksi di bulan {currentMonthStr}
            </p>
          </div>
        </div>

        {/* Card 4: Total Semua Pesanan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Total Semua Pesanan Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {orders.length}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {orders.filter((o) => o.status === "DIBATALKAN").length} dibatalkan kasir
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Visual Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend Daily Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Analitik Penjualan Harian Bulan Ini</span>
              </h4>
              <p className="text-xs text-slate-500">
                Tren omzet per tanggal di bulan {currentMonthStr}
              </p>
            </div>
          </div>

          {Object.keys(daysInMonthMap).length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada data transaksi berhasil pada bulan ini.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {Object.entries(daysInMonthMap).map(([day, data]) => {
                const percentage = Math.min(100, Math.round((data.revenue / maxDayRevenue) * 100));
                return (
                  <div key={day} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Tgl {day}</span>
                      <span className="text-slate-900">
                        {formatRupiah(data.revenue)} ({data.count} order)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Menu Terlaris (Top Performers)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Produk paling diminati oleh pelanggan
              </p>
            </div>
          </div>

          {analytics?.topItems && analytics.topItems.length > 0 ? (
            <div className="space-y-3">
              {analytics.topItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        index === 0
                          ? "bg-amber-400 text-slate-900"
                          : index === 1
                          ? "bg-slate-300 text-slate-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-slate-500 text-[10px]">{item.count} porsi terjual</span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada data menu terlaris terkumpul.
            </div>
          )}
        </div>
      </div>

      {/* Transaction List for Selected Date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-3">
          Rincian Transaksi Tanggal: {selectedDate} ({filteredDailyOrders.length} Pesanan)
        </h4>

        {filteredDailyOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Tidak ada transaksi yang tercatat pada tanggal {selectedDate}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">No. Order</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {formatDate(o.createdAt).split(",")[1] || formatDate(o.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {o.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatRupiah(o.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === "SELESAI"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status === "DIPROSES"
                            ? "bg-blue-100 text-blue-800"
                            : o.status === "DIBATALKAN"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
