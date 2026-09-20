import React, { useState, useRef, useEffect } from "react";
import { PaymentQRConfig } from "../../types";
import { updatePaymentQRConfig, resetPaymentQRConfig, fetchPaymentQRConfig } from "../../services/api";
import {
  QrCode,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Download,
  Eye,
  Store,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  X,
} from "lucide-react";

interface CashierQRManagerProps {
  currentConfig?: PaymentQRConfig | null;
  onConfigUpdated?: (newConfig: PaymentQRConfig) => void;
}

export const CashierQRManager: React.FC<CashierQRManagerProps> = ({
  currentConfig: propConfig,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<PaymentQRConfig>({
    imageUrl: "/qris_makan_santai.jpg",
    merchantName: "MAKAN SANTAI, KBYRN LM",
    merchantCity: "KBYRN LM",
    nmid: "ID1026597604283",
    terminal: "A01",
    printerCode: "93600914",
    useCustomImage: true,
    updatedAt: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [merchantName, setMerchantName] = useState<string>("");
  const [merchantCity, setMerchantCity] = useState<string>("");
  const [nmid, setNmid] = useState<string>("");
  const [terminal, setTerminal] = useState<string>("");
  const [printerCode, setPrinterCode] = useState<string>("");
  const [useCustomImage, setUseCustomImage] = useState<boolean>(true);

  // Modal zoom state
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Sync with prop or fetch from server
  useEffect(() => {
    if (propConfig) {
      applyConfigToForm(propConfig);
    } else {
      setIsLoading(true);
      fetchPaymentQRConfig()
        .then((data) => {
          if (data) {
            applyConfigToForm(data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [propConfig]);

  const applyConfigToForm = (cfg: PaymentQRConfig) => {
    setConfig(cfg);
    setMerchantName(cfg.merchantName || "MAKAN SANTAI, KBYRN LM");
    setMerchantCity(cfg.merchantCity || "KBYRN LM");
    setNmid(cfg.nmid || "ID1026597604283");
    setTerminal(cfg.terminal || "A01");
    setPrinterCode(cfg.printerCode || "93600914");
    setUseCustomImage(cfg.useCustomImage !== false);
    setPreviewImage(null);
    setSelectedFileName("");
  };

  // Handle file select (from file picker or camera)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan!", "error");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      notify("Ukuran foto maksimal 20MB", "error");
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      notify("Foto QR berhasil dimuat. Klik 'Simpan Perubahan' untuk menerapkan!", "success");
    };
    reader.onerror = () => {
      notify("Gagal membaca file gambar", "error");
    };
    reader.readAsDataURL(file);
  };

  // Save changes to backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updates: Partial<PaymentQRConfig> = {
        merchantName: merchantName.trim(),
        merchantCity: merchantCity.trim(),
        nmid: nmid.trim(),
        terminal: terminal.trim(),
        printerCode: printerCode.trim(),
        useCustomImage,
      };

      if (previewImage) {
        updates.imageUrl = previewImage;
      }

      const res = await updatePaymentQRConfig(updates);
      if (res.success && res.data) {
        setConfig(res.data);
        setPreviewImage(null);
        setSelectedFileName("");
        if (onConfigUpdated) {
          onConfigUpdated(res.data);
        }
        notify(res.message || "QRIS Pembayaran berhasil diperbarui dan disinkronkan!", "success");
      } else {
        notify(res.message || "Gagal memperbarui QRIS", "error");
      }
    } catch (err: any) {
      notify(err.message || "Terjadi kesalahan saat menyimpan QRIS", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original default QRIS
  const handleReset = async () => {
    const confirm = window.confirm(
      "Apakah Anda yakin ingin mengembalikan foto dan data QRIS ke foto standee resmi MAKAN SANTAI?"
    );
    if (!confirm) return;

    setIsResetting(true);
    try {
      const res = await resetPaymentQRConfig();
      if (res.success && res.data) {
        applyConfigToForm(res.data);
        if (onConfigUpdated) {
          onConfigUpdated(res.data);
        }
        notify("QRIS berhasil dikembalikan ke foto standee bawaan toko!", "success");
      } else {
        notify(res.message || "Gagal mengembalikan QRIS", "error");
      }
    } catch (err: any) {
      notify(err.message || "Terjadi kesalahan saat reset QRIS", "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Active image to display
  const activeImage = previewImage || config.imageUrl || "/qris_makan_santai.jpg";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-3 shadow-md border text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pengaturan QRIS Pembayaran
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sinkronisasi Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ganti foto kode QR pembayaran atau ubah data NMID toko. Tampilan pada HP pembeli akan langsung terupdate seketika.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Kembalikan ke foto asli standee"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Kembalikan ke Asli</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Form, Right is Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Unggah Foto QR Pembayaran Baru</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih foto QRIS standee toko Anda atau tangkap langsung menggunakan kamera ponsel kasir.
              </p>
            </div>

            {/* Hidden inputs for file and camera */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Action Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center mb-2 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Pilih File Foto QR
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau WebP</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center mb-2 transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Foto QR dengan Kamera
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Langsung dari standee</span>
              </button>
            </div>

            {/* Status of uploaded file */}
            {previewImage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-900 truncate">
                      {selectedFileName || "Foto baru siap diterapkan"}
                    </p>
                    <p className="text-[10px] text-emerald-700">
                      Lihat pratinjau di samping, lalu klik Simpan di bawah
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setSelectedFileName("");
                  }}
                  className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Batalkan foto baru"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Merchant Details Inputs */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                <span>Identitas & Informasi Cetak QRIS</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Merchant / Toko
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Contoh: MAKAN SANTAI, KBYRN LM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Wilayah Merchant
                  </label>
                  <input
                    type="text"
                    value={merchantCity}
                    onChange={(e) => setMerchantCity(e.target.value)}
                    placeholder="Contoh: KBYRN LM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NMID Toko
                  </label>
                  <input
                    type="text"
                    value={nmid}
                    onChange={(e) => setNmid(e.target.value)}
                    placeholder="ID1026597604283"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Terminal
                  </label>
                  <input
                    type="text"
                    value={terminal}
                    onChange={(e) => setTerminal(e.target.value)}
                    placeholder="A01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dicetak Oleh (Printer Code)
                  </label>
                  <input
                    type="text"
                    value={printerCode}
                    onChange={(e) => setPrinterCode(e.target.value)}
                    placeholder="93600914"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Mode Toggle: Custom Standee Image vs Auto Generated */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Prioritaskan Foto Standee QRIS
                </p>
                <p className="text-[11px] text-slate-500">
                  Menampilkan foto resmi standee QRIS MAKAN SANTAI di layar pembeli
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomImage}
                  onChange={(e) => setUseCustomImage(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="submit"
                id="save-qris-config-btn"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Terapkan ke Pembeli</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Notice */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Tips Kasir: </span>
              Pastikan foto QRIS yang diunggah memiliki pencahayaan yang cukup dan kode QR tidak buram agar aplikasi mobile banking dan e-wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA) dapat memindai dengan cepat.
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Preview on Buyer Modal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Pratinjau di Layar Pembeli
                </h3>
              </div>
              {previewImage ? (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Perubahan Belum Disimpan
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Aktif Live
                </span>
              )}
            </div>

            {/* Mockup Card Frame */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 mb-3 relative group overflow-hidden">
                <img
                  src={activeImage}
                  alt="Pratinjau QRIS"
                  className="w-full max-h-72 object-contain mx-auto rounded-xl transition-transform group-hover:scale-[1.02]"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Perbesar</span>
                  </button>
                  <a
                    href={activeImage}
                    download="qris_makan_santai.jpg"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>

              {/* Merchant metadata display */}
              <div className="text-left bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Merchant:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">
                    {merchantName || config.merchantName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>NMID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {nmid || config.nmid}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Terminal:</span>
                  <span className="font-mono text-slate-700">
                    {terminal || config.terminal} • {printerCode || config.printerCode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                  <span>Terakhir Diubah:</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(config.updatedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* Bottom helper */}
              <p className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terverifikasi Bank Indonesia & ASPI</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Zoom Modal */}
      {isZoomModalOpen && (
        <div
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white p-4 rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-white/20 text-center animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-900">{merchantName || config.merchantName}</h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  NMID: {nmid || config.nmid} • {terminal || config.terminal}
                </p>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 overflow-hidden flex justify-center">
              <img
                src={activeImage}
                alt="QRIS Standee"
                className="w-full max-h-[65vh] object-contain rounded-xl"
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <a
                href={activeImage}
                download="qris_makan_santai.jpg"
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar</span>
              </a>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
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
