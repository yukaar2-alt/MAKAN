import React from "react";
import { GoogleUser } from "../../types";
import { Store, User, Lock, Volume2, VolumeX, Bell, LogOut, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  currentMode: "buyer" | "cashier";
  onSwitchMode: (mode: "buyer" | "cashier") => void;
  buyerUser: GoogleUser | null;
  onBuyerLogout: () => void;
  isCashierUnlocked: boolean;
  onCashierLock: () => void;
  pendingOrderCount: number;
  audioAlertEnabled: boolean;
  onToggleAudioAlert: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSwitchMode,
  buyerUser,
  onBuyerLogout,
  isCashierUnlocked,
  onCashierLock,
  pendingOrderCount,
  audioAlertEnabled,
  onToggleAudioAlert,
  lowStockCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  MAKAN SANTAI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  QRIS Real-Time
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Pemesanan Mobile & Terminal Kasir Resmi
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              id="switch-mode-buyer-btn"
              onClick={() => onSwitchMode("buyer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                currentMode === "buyer"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pembeli</span>
              {buyerUser && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 ml-0.5"></span>
              )}
            </button>

            <button
              id="switch-mode-cashier-btn"
              onClick={() => onSwitchMode("cashier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold relative transition-all duration-150 ${
                currentMode === "cashier"
                  ? "bg-slate-700 text-white shadow-sm border border-slate-600"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Kasir (PIN)</span>
              {pendingOrderCount > 0 && (
                <span className="animate-pulse bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                  {pendingOrderCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentMode === "cashier" && isCashierUnlocked && (
              <>
                {/* Audio chime toggle */}
                <button
                  id="toggle-cashier-audio-btn"
                  onClick={onToggleAudioAlert}
                  title={audioAlertEnabled ? "Suara Notifikasi Aktif" : "Suara Notifikasi Mati"}
                  className={`p-2 rounded-lg border transition-colors ${
                    audioAlertEnabled
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {audioAlertEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Stock alert badge */}
                {lowStockCount > 0 && (
                  <div
                    title={`${lowStockCount} barang stok menipis!`}
                    className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-semibold"
                  >
                    <Bell className="w-3.5 h-3.5 animate-bounce text-amber-400" />
                    <span className="hidden md:inline">Stok Menipis:</span>
                    <span>{lowStockCount}</span>
                  </div>
                )}

                {/* Lock Cashier Button */}
                <button
                  id="lock-cashier-btn"
                  onClick={onCashierLock}
                  title="Kunci Layar Kasir"
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Kunci</span>
                </button>
              </>
            )}

            {currentMode === "buyer" && buyerUser && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-2 sm:px-2.5 py-1 rounded-xl">
                {buyerUser.avatarUrl ? (
                  <img
                    src={buyerUser.avatarUrl}
                    alt={buyerUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {buyerUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                      {buyerUser.name}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block max-w-[110px]">
                    {buyerUser.email}
                  </span>
                </div>
                <button
                  id="buyer-logout-btn"
                  onClick={onBuyerLogout}
                  title="Keluar dari Akun Google"
                  className="text-slate-400 hover:text-red-400 p-1 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
