import React, { useState } from "react";
import { verifyCashierPin, changeCashierPin } from "../../services/api";
import { Lock, KeyRound, AlertCircle, CheckCircle2, Delete, X, ShieldAlert } from "lucide-react";

interface CashierPinModalProps {
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const CashierPinModal: React.FC<CashierPinModalProps> = ({
  onUnlockSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showChangePin, setShowChangePin] = useState<boolean>(false);

  // Change PIN states
  const [currentPinInput, setCurrentPinInput] = useState<string>("");
  const [newPinInput, setNewPinInput] = useState<string>("");
  const [changePinMsg, setChangePinMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 6) {
        verifyPinDirect(nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClearPin = () => {
    setPin("");
    setErrorMessage(null);
  };

  const verifyPinDirect = async (inputPin: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    const isValid = await verifyCashierPin(inputPin);
    setIsVerifying(false);

    if (isValid) {
      onUnlockSuccess();
    } else {
      setErrorMessage("PIN Kasir tidak sesuai. Silakan coba lagi.");
      setPin("");
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);

    if (newPinInput.length < 4) {
      setChangePinMsg({ success: false, text: "PIN baru minimal 4 digit angka." });
      return;
    }

    const res = await changeCashierPin(currentPinInput, newPinInput);
    if (res.success) {
      setChangePinMsg({ success: true, text: "PIN Kasir berhasil diubah!" });
      setTimeout(() => {
        setShowChangePin(false);
        setCurrentPinInput("");
        setNewPinInput("");
        setChangePinMsg(null);
      }, 1200);
    } else {
      setChangePinMsg({ success: false, text: res.message || "Gagal mengubah PIN." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Akses Terbatas Kasir</span>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Masukkan PIN Kasir
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan PIN 6 digit untuk membuka terminal kasir & laporan.
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
            PIN Default:
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 my-4">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  isFilled
                    ? "bg-amber-400 border-amber-400 scale-110 shadow-xs shadow-amber-400/50"
                    : "border-slate-600 bg-slate-800"
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mb-3 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto my-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              id={`pin-btn-${digit}`}
              disabled={isVerifying}
              onClick={() => handleDigitClick(digit)}
              className="h-12 sm:h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg sm:text-xl font-bold text-white transition-all active:scale-95 shadow-xs border border-slate-700/60 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClearPin}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center"
          >
            Hapus
          </button>
          <button
            id="pin-btn-0"
            disabled={isVerifying}
            onClick={() => handleDigitClick("0")}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg sm:text-xl font-bold text-white transition-all active:scale-95 shadow-xs border border-slate-700/60 flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDeleteDigit}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Options */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Batal & Ke Mode Pembeli
          </button>
          <button
            onClick={() => setShowChangePin(true)}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ubah PIN</span>
          </button>
        </div>

        {/* Change PIN Modal Overlay */}
        {showChangePin && (
          <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col justify-between animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Ubah PIN Kasir</span>
                </h4>
                <button
                  onClick={() => setShowChangePin(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {changePinMsg && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs mb-3 ${
                    changePinMsg.success
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {changePinMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{changePinMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    PIN Kasir Saat Ini
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Masukkan PIN lama ()"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    PIN Kasir Baru (4-6 Digit)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Masukkan PIN baru"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Simpan PIN Baru
                  </button>
                </div>
              </form>
            </div>

            <button
              onClick={() => setShowChangePin(false)}
              className="text-xs text-slate-400 hover:text-white text-center"
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
