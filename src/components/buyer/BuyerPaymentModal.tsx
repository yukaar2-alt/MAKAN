import React, { useState, useEffect } from "react";
import { GoogleUser, CartItem } from "../../types";
import { formatRupiah } from "../../utils/export";
import { generateQRISPayload, generateQRCodeDataUrl, MERCHANT_NAME, MERCHANT_NMID } from "../../utils/qris";
import {
  QrCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Receipt,
  Sparkles,
} from "lucide-react";

interface BuyerPaymentModalProps {
  buyerUser: GoogleUser;
  cartItems: CartItem[];
  orderType: "dine_in" | "take_away";
  tableNumber?: string;
  onClose: () => void;
  onSubmitOrder: (orderData: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerAvatar?: string;
    items: any[];
    totalAmount: number;
    tableNumber?: string;
    orderType: "dine_in" | "take_away";
    paymentProofUrl: string;
  }) => Promise<void>;
}

export const BuyerPaymentModal: React.FC<BuyerPaymentModalProps> = ({
  buyerUser,
  cartItems,
  orderType,
  tableNumber,
  onClose,
  onSubmitOrder,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [proofImageBase64, setProofImageBase64] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [proofFileSize, setProofFileSize] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes in seconds

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Generate real QR code image for this specific amount
  useEffect(() => {
    const tempOrderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const payload = generateQRISPayload(totalAmount, tempOrderNumber);
    generateQRCodeDataUrl(payload).then(setQrDataUrl);
  }, [totalAmount]);

  // 15-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QRIS-Pembayaran-${totalAmount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle image upload from camera or gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Harap unggah file gambar bukti pembayaran (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar terlalu besar (Maksimal 10MB).");
      return;
    }

    setErrorMsg(null);
    setProofFileName(file.name);
    setProofFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

    const reader = new FileReader();
    reader.onload = () => {
      setProofImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!proofImageBase64) {
      setErrorMsg("Wajib melampirkan foto/tangkapan layar bukti transaksi pembayaran QRIS!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const orderPayload = {
        customerId: buyerUser.googleId,
        customerName: buyerUser.name,
        customerEmail: buyerUser.email,
        customerAvatar: buyerUser.avatarUrl,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          notes: item.notes,
        })),
        totalAmount,
        tableNumber: tableNumber || (orderType === "dine_in" ? "Meja 1" : undefined),
        orderType,
        paymentProofUrl: proofImageBase64,
      };

      await onSubmitOrder(orderPayload);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pesanan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Pembayaran QRIS
              </h3>
              <p className="text-[11px] text-slate-300">
                Resmi • Standar Bank Indonesia & ASPI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-100/80 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1 text-emerald-700">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Scan QR</span>
          </div>
          <span className="text-slate-300">›</span>
          <div className="flex items-center gap-1 text-emerald-700">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Bayar Tagihan</span>
          </div>
          <span className="text-slate-300">›</span>
          <div className="flex items-center gap-1 text-slate-800">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Kirim Struk</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Official QRIS Presentation Frame */}
          <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {/* QRIS Official Red Banner */}
            <div className="bg-red-600 px-4 py-2 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider font-sans">QRIS</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                  GPN
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-tight block">
                  {MERCHANT_NAME}
                </span>
                <span className="text-[9px] text-red-100 block font-mono">
                  NMID: {MERCHANT_NMID}
                </span>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="px-4 pt-2.5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Sisa Waktu Pembayaran:
              </span>
              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                {formatTimer(timeLeft)}
              </span>
            </div>

            {/* Sharp QR Code View with Scanning Corner Guides */}
            <div className="flex justify-center my-3 px-4">
              <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                {/* Visual Corner Markers */}
                <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-600 rounded-tl-sm" />
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-600 rounded-tr-sm" />
                <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-600 rounded-bl-sm" />
                <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-600 rounded-br-sm" />

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QRIS Barcode"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Memuat Kode QRIS...
                  </div>
                )}
              </div>
            </div>

            {/* Total Amount Pill with Quick Copy */}
            <div className="mx-4 mb-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">
                  Total Tagihan Pas
                </span>
                <span className="text-xl font-extrabold text-emerald-800 font-mono">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAmount}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isCopied
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100/50"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nominal</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Action Buttons */}
            <div className="px-4 pb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Simpan Gambar QR</span>
              </button>
            </div>

            {/* Supported Banks / Wallets Micro Chips */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-center gap-1.5 flex-wrap text-[10px] text-slate-500">
              <span className="font-semibold text-slate-700">Mendukung:</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">BCA</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">Mandiri</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">BRI</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">GoPay</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">OVO</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">Dana</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">ShopeePay</span>
            </div>
          </div>

          {/* Collapsible Order Summary */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowOrderDetails(!showOrderDetails)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Rincian Pesanan ({cartItems.length} menu • {orderType === "dine_in" ? `Makan di Tempat (${tableNumber || "Meja 1"})` : "Bungkus / Bawa Pulang"})</span>
              </span>
              {showOrderDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showOrderDetails && (
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs divide-y divide-slate-100">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {item.quantity}x {item.product.name}
                      </span>
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-slate-700 font-medium">
                      {formatRupiah(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory Transaction Proof Upload */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Unggah Bukti Struk Transaksi</span>
              </label>
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                Wajib Dilampirkan
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Foto atau tangkapan layar (screenshot) bukti transfer sukses dari m-Banking atau E-Wallet Anda.
            </p>

            {proofImageBase64 ? (
              <div className="rounded-2xl border-2 border-emerald-500 overflow-hidden bg-slate-900 p-2.5 relative group">
                <img
                  src={proofImageBase64}
                  alt="Bukti Transfer QRIS"
                  className="max-h-44 w-full object-contain mx-auto rounded-lg bg-black/40"
                />

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[190px]">
                      {proofFileName || "Struk Pembayaran Berhasil"}
                    </span>
                    {proofFileSize && (
                      <span className="text-[10px] text-slate-400">({proofFileSize})</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProofImageBase64("");
                      setProofFileName("");
                      setProofFileSize("");
                    }}
                    className="px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="payment-proof-file-input"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 bg-slate-50/80 hover:bg-emerald-50/30 cursor-pointer transition-colors text-center group"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Ambil Foto Struk atau Pilih Gambar
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Format JPG, PNG, WebP (Maksimal 10MB)
                </span>
                <input
                  id="payment-proof-file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Cashier Verification Note */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold text-amber-950">Verifikasi Kasir Real-Time: </span>
              Pesanan akan langsung masuk ke terminal kasir dan diproses setelah kasir memverifikasi bukti struk transaksi Anda.
            </div>
          </div>
        </div>

        {/* Modal Submit Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            id="submit-order-with-proof-btn"
            type="button"
            disabled={!proofImageBase64 || isSubmitting}
            onClick={handleSubmit}
            className={`w-2/3 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              !proofImageBase64 || isSubmitting
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Pesanan ke Kasir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
