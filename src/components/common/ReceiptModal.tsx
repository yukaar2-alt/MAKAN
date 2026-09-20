import React, { useState, useEffect } from "react";
import { Order, ReceiptPaperSize } from "../../types";
import {
  printReceipt,
  generateReceiptText,
  downloadReceiptPDF,
  generateReceiptHTML,
} from "../../utils/printReceipt";
import { formatRupiah, formatDate } from "../../utils/export";
import {
  Printer,
  X,
  Copy,
  Check,
  Download,
  Settings2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ReceiptModalProps {
  order: Order | null;
  isOpen?: boolean;
  onClose: () => void;
  autoPrintEnabled?: boolean;
  onToggleAutoPrint?: (enabled: boolean) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen = true,
  onClose,
  autoPrintEnabled = true,
  onToggleAutoPrint,
}) => {
  const [paperSize, setPaperSize] = useState<ReceiptPaperSize>(() => {
    return (localStorage.getItem("cashier_paper_size") as ReceiptPaperSize) || "58mm";
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem("cashier_paper_size", paperSize);
  }, [paperSize]);

  if (!isOpen || !order) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintSuccess(false);
    try {
      const ok = await printReceipt(order, { paperSize });
      if (ok) {
        setPrintSuccess(true);
        setTimeout(() => setPrintSuccess(false), 3000);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyText = () => {
    const text = generateReceiptText(order, { paperSize });
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    downloadReceiptPDF(order, paperSize);
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Cetak Struk Kasir (Thermal POS)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pesanan #{order.orderNumber} &bull; {order.customerName}
              </p>
            </div>
          </div>

          <button
            id="close-receipt-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size & Controls Bar */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Ukuran Kertas:</span>
            <div className="inline-flex bg-white rounded-xl p-0.5 border border-slate-300 shadow-xs">
              <button
                id="receipt-paper-58mm-btn"
                onClick={() => setPaperSize("58mm")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paperSize === "58mm"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                58mm (Portabel)
              </button>
              <button
                id="receipt-paper-80mm-btn"
                onClick={() => setPaperSize("80mm")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paperSize === "80mm"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                80mm (POS Kasir)
              </button>
            </div>
          </div>

          {onToggleAutoPrint && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-2.5 py-1 rounded-xl border border-slate-300">
              <input
                id="receipt-autoprint-checkbox"
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={(e) => onToggleAutoPrint(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700 text-[11px]">
                Auto-Print saat Konfirmasi
              </span>
            </label>
          )}
        </div>

        {/* Notification Banner */}
        {printSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Perintah cetak struk berhasil dikirim ke printer kasir yang terhubung!
            </span>
          </div>
        )}

        {/* Receipt Visual Preview (Simulating actual thermal roll paper) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center">
          <div
            className={`bg-white text-black shadow-lg rounded-sm border border-slate-300 font-mono text-xs transition-all relative ${
              paperSize === "58mm" ? "w-[260px] p-3 text-[11px]" : "w-[340px] p-4 text-[12px]"
            }`}
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            {/* Top feed tear effect */}
            <div className="absolute top-0 left-0 right-0 h-1 border-t-2 border-dashed border-slate-300"></div>

            {/* Store Header */}
            <div className="text-center pt-2">
              <h4 className="font-black tracking-wider text-sm sm:text-base">
                MAKAN SANTAI
              </h4>
              <p className="text-[10px] text-slate-600 mt-0.5">
                
              </p>
              <p className="text-[10px] text-slate-600">Telp: 0812-3456-7890</p>
            </div>

            <div className="my-2 border-t-2 border-black border-dashed"></div>

            {/* Meta */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDate(order.confirmedAt || order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>Kasir POS 01</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe:</span>
                <span className="font-bold">
                  {order.orderType === "dine_in"
                    ? `DINE IN (Meja ${order.tableNumber || "-"})`
                    : "TAKE AWAY (Bungkus)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold truncate max-w-[130px]">{order.customerName}</span>
              </div>
            </div>

            <div className="my-2 border-t border-black border-dashed"></div>

            {/* Items */}
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold leading-tight">{item.productName}</div>
                  <div className="flex justify-between text-[10px] text-slate-800">
                    <span>
                      {item.quantity} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-bold">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-slate-500 italic pl-1.5">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="my-2 border-t border-black border-dashed"></div>

            {/* Totals */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Diskon:</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (PB1):</span>
                <span>Termasuk (10%)</span>
              </div>
            </div>

            <div className="my-2 border-t-2 border-black"></div>

            <div className="flex justify-between text-xs sm:text-sm font-black py-0.5">
              <span>TOTAL TAGIHAN:</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>

            <div className="my-2 border-t border-black border-dashed"></div>

            {/* Payment Verification */}
            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-bold">QRIS Dinamis</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold underline">LUNAS / BERHASIL</span>
              </div>
            </div>

            <div className="text-center mt-2.5">
              <span className="inline-block border border-black px-2 py-0.5 text-[9px] font-bold">
                VERIFIKASI QRIS GPN SUKSES
              </span>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-slate-700 mt-3 pt-2 border-t border-slate-300 border-dashed space-y-0.5">
              <p className="font-bold">Terima kasih atas kunjungan Anda!</p>
              <p>Simpan struk ini sebagai bukti transaksi sah.</p>
              <p className="text-[8px] text-slate-400 mt-1">*** Selamat Menikmati ***</p>
            </div>

            {/* Bottom serrated cut effect */}
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-t from-slate-200 to-transparent"></div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              id="copy-receipt-text-btn"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95"
              title="Salin teks struk untuk dikirim via WhatsApp/SMS"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks WA</span>
                </>
              )}
            </button>

            <button
              id="download-receipt-pdf-btn"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95"
              title="Simpan berkas PDF struk"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-receipt-action-btn"
              disabled={isPrinting}
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Mengirim ke Printer..." : "Cetak ke Printer Kasir"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
