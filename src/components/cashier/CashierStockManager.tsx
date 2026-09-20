import React, { useState } from "react";
import { Product } from "../../types";
import { formatRupiah } from "../../utils/export";
import { sendStockAlertEmail } from "../../services/api";
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  CheckCircle2,
  Search,
  BellRing,
  X,
  Sparkles,
  Mail,
  Send,
  RefreshCw,
} from "lucide-react";

interface CashierStockManagerProps {
  products: Product[];
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onCreateProduct: (product: Omit<Product, "id">) => Promise<void>;
}

export const CashierStockManager: React.FC<CashierStockManagerProps> = ({
  products,
  onUpdateProduct,
  onCreateProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSendingStockEmail, setIsSendingStockEmail] = useState<boolean>(false);
  const [stockEmailToast, setStockEmailToast] = useState<string | null>(null);

  // Form states for Add Product
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Makanan Utama");
  const [newStock, setNewStock] = useState("20");
  const [newMinAlert, setNewMinAlert] = useState("5");
  const [newImage, setNewImage] = useState("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80");

  const categories = ["Semua", "Makanan Utama", "Minuman", "Snack & Cemilan"];

  const lowStockItems = products.filter((p) => p.stock <= p.minStockAlert);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "Semua" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAdjustStock = async (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const nextStock = Math.max(0, prod.stock + delta);
    await onUpdateProduct(productId, { stock: nextStock });
  };

  const handleSetStockDirect = async (productId: string, stockValue: number) => {
    if (isNaN(stockValue) || stockValue < 0) return;
    await onUpdateProduct(productId, { stock: stockValue });
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onUpdateProduct(editingProduct.id, {
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      category: editingProduct.category,
      stock: editingProduct.stock,
      minStockAlert: editingProduct.minStockAlert,
      isAvailable: editingProduct.isAvailable,
      image: editingProduct.image,
    });
    setEditingProduct(null);
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateProduct({
      name: newName.trim(),
      description: newDesc.trim(),
      price: Number(newPrice) || 0,
      category: newCategory,
      stock: Number(newStock) || 0,
      minStockAlert: Number(newMinAlert) || 5,
      isAvailable: true,
      image: newImage.trim(),
    });
    setIsAddModalOpen(false);
    // Reset form
    setNewName("");
    setNewDesc("");
    setNewPrice("");
  };

  const handleSendStockAlertEmail = async () => {
    setIsSendingStockEmail(true);
    setStockEmailToast(null);
    try {
      const res = await sendStockAlertEmail("ibeywy@gmail.com");
      if (res) {
        setStockEmailToast(`Rekap stok menipis (${lowStockItems.length} menu) berhasil dikirim ke ibeywy@gmail.com!`);
        setTimeout(() => setStockEmailToast(null), 5000);
      }
    } finally {
      setIsSendingStockEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {stockEmailToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{stockEmailToast}</span>
          </div>
          <button
            onClick={() => setStockEmailToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Low Stock Urgent Notification Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <span>Peringatan Stok Menipis ({lowStockItems.length} Produk)</span>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  Perlu Restock
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Persediaan barang berikut hampir habis:{" "}
                <span className="font-semibold">
                  {lowStockItems.map((p) => `${p.name} (sisa ${p.stock})`).join(", ")}
                </span>
                . Notifikasi otomatis dikirim ke email admin (ibeywy@gmail.com).
              </p>
            </div>
          </div>

          <button
            id="send-stock-email-banner-btn"
            disabled={isSendingStockEmail}
            onClick={handleSendStockAlertEmail}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isSendingStockEmail ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>Kirim Rekap ke ibeywy@gmail.com</span>
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari barang / inventaris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="send-stock-alert-btn"
            disabled={isSendingStockEmail}
            onClick={handleSendStockAlertEmail}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
            title="Kirim status stok ke email ibeywy@gmail.com"
          >
            {isSendingStockEmail ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden sm:inline">Email Status Stok ke Admin</span>
            <span className="sm:hidden">Email Stok</span>
          </button>

          <button
            id="add-new-product-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredProducts.map((prod) => {
          const isLow = prod.stock <= prod.minStockAlert;
          const isZero = prod.stock === 0;

          return (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center justify-between gap-3 transition-all ${
                isZero
                  ? "border-red-300 bg-red-50/20"
                  : isLow
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {prod.name}
                    </h4>
                    {isZero ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                        Habis
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Sisa {prod.stock}</span>
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 block">
                    {formatRupiah(prod.price)} • {prod.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Batas Minimum Notifikasi: {prod.minStockAlert} unit
                  </span>
                </div>
              </div>

              {/* Stock Stepper & Edit */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => handleAdjustStock(prod.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-xs"
                    title="Kurangi 1"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={prod.stock}
                    onChange={(e) => handleSetStockDirect(prod.id, parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-bold text-xs bg-transparent focus:outline-none text-slate-900"
                  />
                  <button
                    onClick={() => handleAdjustStock(prod.id, 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                    title="Tambah 1"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleAdjustStock(prod.id, 5)}
                    className="ml-1 text-[10px] px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded"
                    title="Tambah 5 unit"
                  >
                    +5
                  </button>
                </div>

                <button
                  onClick={() => setEditingProduct(prod)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                  title="Ubah Detail Produk"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-bold text-slate-900">Ubah Data Menu & Stok</h4>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack & Cemilan">Snack & Cemilan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Peringatan</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.minStockAlert}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStockAlert: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Produk</label>
                <input
                  type="url"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Tambah Menu Baru</span>
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sate Ayam Madura"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Keterangan bahan atau rasa..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack & Cemilan">Snack & Cemilan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Peringatan Menipis</label>
                  <input
                    type="number"
                    required
                    value={newMinAlert}
                    onChange={(e) => setNewMinAlert(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Produk</label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Tambahkan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
