import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Tag,
  Barcode,
  ShoppingBag,
  RotateCcw,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Product } from '../types/pos';
import { formatRupiah } from '../utils/formatters';

interface ProductCatalogViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetProducts: () => void;
  onAddToCartDirect: (product: Product) => void;
  onOpenYoloSettings: () => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  onAddProduct,
  onDeleteProduct,
  onResetProducts,
  onAddToCartDirect,
  onOpenYoloSettings,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // New product form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan & Minuman');
  const [price, setPrice] = useState<number>(10000);
  const [barcode, setBarcode] = useState('');
  const [yoloClass, setYoloClass] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.yoloClass.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !yoloClass.trim() || price <= 0) return;

    const newProd: Product = {
      id: `prod_custom_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      price: price,
      barcode: barcode.trim() || `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      yoloClass: yoloClass.trim().toLowerCase().replace(/\s+/g, '_'),
      description: 'Didaftarkan manual di katalog kasir',
    };

    onAddProduct(newProd);
    setName('');
    setYoloClass('');
    setPrice(10000);
    setBarcode('');
    setIsAddingNew(false);
  };

  const handleDirectAdd = (product: Product) => {
    onAddToCartDirect(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Katalog Produk & Pemetaan Kelas Model YOLO
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar produk dan nama label kelas (<code className="font-mono text-slate-700">class label</code>) dari model <code className="font-mono text-slate-700">best.pt</code> yang Anda latih di Colab
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenYoloSettings}
            className="cursor-pointer px-3 py-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
            title="Tarik daftar kelas dari model .pt yang aktif di Hugging Face"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tarik Kelas dari Model .pt</span>
          </button>

          <button
            type="button"
            onClick={onResetProducts}
            className="cursor-pointer px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Kembalikan produk ke data standar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama barang, class label YOLO (misal: indomie_goreng), atau barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
        />
      </div>

      {/* Form Add New Product */}
      {isAddingNew && (
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Form Tambah Produk & Label YOLO (.pt)
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Produk untuk Struk Kasir
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Indomie Soto Lamongan 80g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Label Kelas Model (Sesuai output model.names di Colab)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: indomie_soto"
                value={yoloClass}
                onChange={(e) => setYoloClass(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pastikan nama label sama persis dengan yang Anda latih di file data.yaml Colab
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Harga Jual Kasir (Rp)
              </label>
              <input
                type="number"
                required
                min="500"
                step="500"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kategori Produk
              </label>
              <input
                type="text"
                placeholder="Makanan / Minuman / Snack"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Barcode (Opsional)
              </label>
              <input
                type="text"
                placeholder="899..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="cursor-pointer w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Simpan ke Katalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Label Model YOLO (.pt)</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Satuan</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4 text-center">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{prod.name}</span>
                      {prod.description && (
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                          {prod.description}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/50">
                        {prod.yoloClass}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{prod.category}</td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {formatRupiah(prod.price)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">{prod.barcode}</td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDirectAdd(prod)}
                          className="cursor-pointer px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                          title="Tambahkan langsung ke keranjang kasir"
                        >
                          {justAddedId === prod.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5" />
                          )}
                          <span>{justAddedId === prod.id ? 'Ditambah!' : '+ Kasir'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod.id)}
                          className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
