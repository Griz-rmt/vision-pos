import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Barcode,
  Search,
  CreditCard,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CartItem, Product } from '../types/pos';
import { formatRupiah } from '../utils/formatters';

interface CartPanelProps {
  items: CartItem[];
  allProducts: Product[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onAddToCart: (product: Product, method: 'barcode' | 'manual') => void;
  onProceedToPayment: () => void;
  includeTax: boolean;
  setIncludeTax: (val: boolean) => void;
  discountAmount: number;
  setDiscountAmount: (val: number) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  items,
  allProducts,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart,
  onProceedToPayment,
  includeTax,
  setIncludeTax,
  discountAmount,
  setDiscountAmount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = includeTax ? Math.round(subtotal * 0.11) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered products for quick manual add
  const filteredProducts = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery) ||
          p.yoloClass.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectQuickProduct = (product: Product) => {
    onAddToCart(product, 'manual');
    setSearchQuery('');
    setShowQuickSearch(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Keranjang Belanja
          </h2>
          {totalItemsCount > 0 && (
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {totalItemsCount} item
            </span>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="cursor-pointer text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Manual Search & Barcode Fallback Input */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama barang atau scan barcode manual..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowQuickSearch(true);
            }}
            onFocus={() => setShowQuickSearch(true)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Dropdown list of matched products */}
        {showQuickSearch && searchQuery.trim() && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectQuickProduct(prod)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      YOLO: {prod.yoloClass} · #{prod.barcode}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {formatRupiah(prod.price)}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                Barang tidak ditemukan di katalog
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Arahkan kamera ke barang atau klik &quot;Pindai Frame&quot; untuk mendeteksi barang otomatis dengan YOLO AI.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.product.name}
                  </p>
                  {item.addedMethod.startsWith('yolo') && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      YOLO
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span className="font-mono tabular-nums">{formatRupiah(item.product.price)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-400 text-[10px]">{item.product.yoloClass}</span>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="cursor-pointer w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Kurangi jumlah"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="cursor-pointer w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Tambah jumlah"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-20">
                  <span className="block font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {formatRupiah(item.product.price * item.quantity)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="cursor-pointer text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  title="Hapus dari keranjang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Breakdown & Checkout Action */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums text-slate-900">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
              />
              <span>Pajak PPN (11%)</span>
            </label>
            <span className="font-mono tabular-nums text-slate-900">{formatRupiah(tax)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span>Potongan Diskon</span>
              <span className="font-mono tabular-nums">-{formatRupiah(discountAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Total Pembayaran</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Quick Discount Trigger */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Ada promo khusus?</span>
          <button
            type="button"
            onClick={() => {
              if (discountAmount === 0) {
                setDiscountAmount(5000);
              } else {
                setDiscountAmount(0);
              }
            }}
            className="cursor-pointer text-slate-700 hover:text-slate-900 underline font-medium"
          >
            {discountAmount === 0 ? '+ Tambah Diskon Rp 5.000' : 'Hapus Diskon'}
          </button>
        </div>

        {/* Proceed to Payment Button */}
        <button
          type="button"
          onClick={onProceedToPayment}
          disabled={items.length === 0}
          className="cursor-pointer w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          <span>Lanjut ke Pembayaran ({formatRupiah(total)})</span>
        </button>
      </div>
    </div>
  );
};
