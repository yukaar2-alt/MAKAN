import React, { useState } from "react";
import { Product } from "../../types";
import { formatRupiah } from "../../utils/export";
import {
  Search,
  Plus,
  AlertCircle,
  Sparkles,
  X,
  MessageSquare,
  LayoutGrid,
  List,
  Flame,
  Coffee,
  Utensils,
  Cookie,
  SlidersHorizontal,
  Check,
  Store,
} from "lucide-react";

interface BuyerMenuProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
  cartItemCounts: Record<string, number>;
}

export const BuyerMenu: React.FC<BuyerMenuProps> = ({
  products,
  onAddToCart,
  cartItemCounts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "stock">("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeItemForNotes, setActiveItemForNotes] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>("");

  const categories = [
    { name: "Semua", icon: Utensils },
    { name: "Makanan Utama", icon: Flame },
    { name: "Minuman", icon: Coffee },
    { name: "Snack & Cemilan", icon: Cookie },
  ];

  // Quick note suggestions depending on category
  const quickNotesSuggestions = [
    "Pedas sedang",
    "Tidak pedas",
    "Es sedikit",
    "Gula sedikit",
    "Bungkus terpisah",
    "Sambal dipisah",
  ];

  // Category counts
  const categoryCounts: Record<string, number> = {
    Semua: products.length,
  };
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // Filter products
  const filteredProducts = products
    .filter((p) => {
      const matchesCategory =
        selectedCategory === "Semua" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "stock") return b.stock - a.stock;
      return 0; // default order
    });

  const openNotesModal = (product: Product) => {
    if (product.stock <= 0 || !product.isAvailable) return;
    setActiveItemForNotes(product);
    setItemQuantity(1);
    setItemNotes("");
  };

  const handleConfirmAddToCart = () => {
    if (!activeItemForNotes) return;
    onAddToCart(activeItemForNotes, itemQuantity, itemNotes.trim() || undefined);
    setActiveItemForNotes(null);
  };

  return (
    <div className="pb-28 max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 space-y-4">
      {/* Store Operational Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                MAKAN SANTAI
              </h2>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Buka
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pesan menu favorit dari meja Anda • Pembayaran QRIS instan & cepat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <span>Total Menu: <b className="text-white">{products.length}</b></span>
          <span className="text-slate-500">•</span>
          <span>Siap Saji</span>
        </div>
      </div>

      {/* Search and Sticky Category Filter Controls */}
      <div className="sticky top-14 sm:top-16 z-20 bg-slate-50/95 backdrop-blur-md -mx-3 px-3 sm:-mx-6 sm:px-6 py-1.5 transition-all">
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
          {/* Search & Layout Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="menu-search-input"
                type="text"
                placeholder="Cari menu makanan, minuman, cemilan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="default">Rekomendasi</option>
                <option value="price_asc">Harga Termurah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="stock">Stok Terbanyak</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Grid / List Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Tampilan List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Pills with Icons & Item Counts */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.name] || 0;
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-[1.02]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Items Render */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Menu tidak ditemukan</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada menu yang sesuai dengan kata kunci "{searchQuery}" pada kategori {selectedCategory}.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Semua");
            }}
            className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            Reset Pencarian
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0 || !product.isAvailable;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
            const inCartCount = cartItemCounts[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  isOutOfStock
                    ? "border-slate-200 opacity-65 grayscale-[35%]"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Photo with clean tags */}
                  <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden group">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Stock & Status Badges */}
                    {isOutOfStock ? (
                      <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>Habis</span>
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span>Sisa {product.stock} Porsi!</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>Tersedia ({product.stock})</span>
                      </div>
                    )}

                    {/* Category tag */}
                    <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-slate-100">
                      {product.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="p-3.5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Harga
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                      {formatRupiah(product.price)}
                    </span>
                  </div>

                  {inCartCount > 0 ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 p-1 rounded-xl border border-emerald-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNotesModal(product);
                        }}
                        title="Ubah Catatan Khusus"
                        className="p-1 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-emerald-800 px-1 font-mono">
                        {inCartCount}x
                      </span>
                      <button
                        id={`add-to-cart-btn-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product, 1);
                        }}
                        title="Tambah 1 porsi lagi"
                        className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`add-to-cart-btn-${product.id}`}
                      disabled={isOutOfStock}
                      onClick={() => openNotesModal(product)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isOutOfStock
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pesan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-2xs">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0 || !product.isAvailable;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
            const inCartCount = cartItemCounts[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                  isOutOfStock ? "opacity-60 bg-slate-50/60" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                        Habis
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {product.name}
                      </h3>
                      {isLowStock && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                          Sisa {product.stock}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {product.description}
                    </p>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono mt-1 block">
                      {formatRupiah(product.price)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {inCartCount > 0 ? (
                    <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-xl border border-emerald-200">
                      <button
                        onClick={() => openNotesModal(product)}
                        className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-lg"
                        title="Catatan"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-emerald-800 px-1 font-mono">
                        {inCartCount}x
                      </span>
                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="w-6 h-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isOutOfStock}
                      onClick={() => openNotesModal(product)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                        isOutOfStock
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pesan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Notes & Customization Modal */}
      {activeItemForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeItemForNotes.image}
                  alt={activeItemForNotes.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {activeItemForNotes.name}
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">
                    {formatRupiah(activeItemForNotes.price)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveItemForNotes(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Jumlah Porsi
                </label>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 pl-1 font-medium">
                    Tersedia: {activeItemForNotes.stock} porsi
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
                    >
                      -
                    </button>
                    <span className="text-sm font-extrabold text-slate-900 w-6 text-center font-mono">
                      {itemQuantity}
                    </span>
                    <button
                      onClick={() =>
                        setItemQuantity((q) => Math.min(activeItemForNotes.stock, q + 1))
                      }
                      className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Special Instructions & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Catatan Khusus (Opsional)</span>
                </label>

                {/* Quick note suggestion chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickNotesSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setItemNotes((prev) =>
                          prev ? `${prev}, ${suggestion}` : suggestion
                        );
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-full text-slate-600 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  placeholder="Contoh: Es dipisah, jangan terlalu pedas, bumbu di pinggir..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Subtotal Calculation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Subtotal Item</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  {formatRupiah(activeItemForNotes.price * itemQuantity)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                id="confirm-add-to-cart-modal-btn"
                onClick={handleConfirmAddToCart}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Tambahkan ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
