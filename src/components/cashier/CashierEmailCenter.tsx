import React, { useState, useEffect } from "react";
import { EmailLog } from "../../types";
import {
  fetchEmailLogs,
  sendTestAdminEmail,
  sendReportPDFEmail,
  sendStockAlertEmail,
  updateAdminEmailRecipient,
} from "../../services/api";
import { formatDate } from "../../utils/export";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  BellRing,
  FileText,
  Paperclip,
  Edit2,
  Check,
} from "lucide-react";

export const CashierEmailCenter: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [adminEmail, setAdminEmail] = useState<string>("ibeywy@gmail.com");
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState<string>("ibeywy@gmail.com");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSendingPDF, setIsSendingPDF] = useState<boolean>(false);
  const [isSendingStock, setIsSendingStock] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLogs = async () => {
    const data = await fetchEmailLogs();
    setLogs(data.logs);
    if (data.adminEmail) {
      setAdminEmail(data.adminEmail);
      setInputEmail(data.adminEmail);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSaveEmail = async () => {
    if (!inputEmail || !inputEmail.includes("@")) return;
    const ok = await updateAdminEmailRecipient(inputEmail);
    if (ok) {
      setAdminEmail(inputEmail);
      setIsEditingEmail(false);
      setToastMessage(`Email penerima berhasil diubah menjadi ${inputEmail}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const result = await sendTestAdminEmail(adminEmail);
      if (result) {
        setToastMessage(`Uji email berhasil dikirim ke ${adminEmail}!`);
        loadLogs();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendPDFReportEmail = async () => {
    setIsSendingPDF(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await sendReportPDFEmail({
        to: adminEmail,
        reportDate: today,
        attachmentName: `Laporan_Kasir_${today}.pdf`,
      });
      if (result) {
        setToastMessage(`Laporan PDF berhasil dikirim ke ${adminEmail}!`);
        loadLogs();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } finally {
      setIsSendingPDF(false);
    }
  };

  const handleSendStockRecapEmail = async () => {
    setIsSendingStock(true);
    try {
      const result = await sendStockAlertEmail(adminEmail);
      if (result) {
        setToastMessage(`Rekap status stok barang berhasil dikirim ke ${adminEmail}!`);
        loadLogs();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } finally {
      setIsSendingStock(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email Integration Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Integrasi Notifikasi Email & Laporan Otomatis
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Aktif</span>
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-slate-500">Email Tujuan:</span>
                {isEditingEmail ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleSaveEmail}
                      className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      title="Simpan"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setInputEmail(adminEmail);
                        setIsEditingEmail(false);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Batal"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {adminEmail}
                    </span>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Ubah Email"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Orderan Baru</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Konfirmasi Bayar</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-amber-500" />
                  <span>Peringatan Stok Menipis</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-red-500" />
                  <span>Laporan PDF Terlampir</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              id="send-pdf-report-email-btn"
              disabled={isSendingPDF}
              onClick={handleSendPDFReportEmail}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Kirimkan Laporan PDF Penjualan ke email admin"
            >
              {isSendingPDF ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Kirim Laporan PDF</span>
            </button>

            <button
              id="send-stock-email-btn"
              disabled={isSendingStock}
              onClick={handleSendStockRecapEmail}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Kirim status stok ke email admin"
            >
              {isSendingStock ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <BellRing className="w-3.5 h-3.5" />
              )}
              <span>Kirim Rekap Stok</span>
            </button>

            <button
              id="send-test-email-btn"
              disabled={isSendingTest}
              onClick={handleSendTestEmail}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Uji Tes</span>
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Email Dispatch History Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Riwayat Pengiriman Notifikasi Email ({logs.length})</span>
            </h4>
            <p className="text-xs text-slate-400">
              Log aktivitas notifikasi real-time yang dikirimkan ke email admin ({adminEmail})
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Belum ada notifikasi email terkirim. Log akan bertambah otomatis saat pesanan dibuat, dikonfirmasi, atau stok menipis.
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => {
              const isPdf = log.type === "pdf_report";
              const isLowStock = log.type === "low_stock";
              const isNewOrder = log.type === "new_order";

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border text-xs transition-colors ${
                    isPdf
                      ? "bg-red-50/50 border-red-200"
                      : isLowStock
                      ? "bg-amber-50/50 border-amber-200"
                      : isNewOrder
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      {isPdf ? (
                        <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      ) : isLowStock ? (
                        <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">{log.subject}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDate(log.sentAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed pl-6">
                    {log.body}
                  </p>

                  {log.attachmentName && (
                    <div className="mt-2 ml-6 flex items-center gap-1.5 text-[11px] text-red-700 bg-red-100/70 border border-red-200 px-2.5 py-1 rounded-md w-fit font-semibold">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Berkas Lampiran: {log.attachmentName}</span>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 pl-6">
                    <span>Terkirim ke: <span className="font-semibold text-slate-700">{log.to}</span></span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Status: Terkirim Sukses</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
