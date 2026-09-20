import React, { useState } from "react";
import { CartItem } from "../../types";
import { formatRupiah } from "../../utils/export";
import { ShoppingBag, X, Trash2, ArrowRight, Utensils, Package, Plus, Minus } from "lucide-react";

interface BuyerCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (orderType: "dine_in" | "take_away", tableNumber?: string) => void;
}

export const BuyerCart: React.FC<BuyerCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">("dine_in");
  const [tableNumber, setTableNumber] = useState<string>("");

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (cartItems.length === 0) return null;

  const handleCheckout = () => {
    onProceedToPayment(orderType, orderType === "dine_in" ? tableNumber : undefined);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Bottom Cart Bar */}
      {!isOpen && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom duration-300">
          <button
            id="open-cart-drawer-btn"
            onClick={() => setIsOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-slate-700/80 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-slate-900 text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xs">
                  {totalItemsCount}
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-300 block">Total Keranjang</span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition-colors">
              <span>Periksa</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Keranjang Pesanan ({totalItemsCount} item)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearCart}
                  title="Kosongkan Keranjang"
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus Semua</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-xs font-semibold text-emerald-600 block">
                      {formatRupiah(item.product.price)}
                    </span>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center hover:bg-emerald-700 active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Hapus item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Settings (Dine in vs Take away) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("dine_in")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    orderType === "dine_in"
                      ? "bg-white border-emerald-500 text-emerald-700 shadow-xs"
                      : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Makan di Tempat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("take_away")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    orderType === "take_away"
                      ? "bg-white border-emerald-500 text-emerald-700 shadow-xs"
                      : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Bungkus (Take Away)</span>
                </button>
              </div>

              {orderType === "dine_in" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Meja Anda
                  </label>
                  <input
                    id="table-number-input"
                    type="text"
                    placeholder="Contoh: Meja 05"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Total Summary */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-medium">Total Pembayaran QRIS</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <button
                id="proceed-to-payment-btn"
                onClick={handleCheckout}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              >
                <span>Lanjut Bayar via QRIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
