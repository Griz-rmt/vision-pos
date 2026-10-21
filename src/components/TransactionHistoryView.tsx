import React from 'react';
import { History, Eye, Printer, ShoppingBag, DollarSign, Receipt } from 'lucide-react';
import { Transaction } from '../types/pos';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  onSelectTransaction: (trx: Transaction) => void;
  onNewTransaction: () => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  onSelectTransaction,
  onNewTransaction,
}) => {
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalItemsSold = transactions.reduce(
    (sum, t) => sum + t.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );
  const avgBasket = transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Pendapatan Sesi</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatRupiah(totalSales)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Jumlah Transaksi Sukses</span>
            <Receipt className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {transactions.length} Transaksi
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Rata-rata Keranjang Belanja</span>
            <ShoppingBag className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatRupiah(avgBasket)}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Penjualan Kasir</h3>
            <p className="text-xs text-slate-500">
              Daftar nota transaksi yang tercatat secara real-time
            </p>
          </div>

          <button
            type="button"
            onClick={onNewTransaction}
            className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Buka Kasir Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Item Terbeli</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Aksi Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((trx) => {
                  const itemCount = trx.items.reduce((s, it) => s + it.quantity, 0);
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {trx.transactionNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDateTime(trx.timestamp)}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold">{itemCount} barang</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                          {trx.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="uppercase font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {trx.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        {formatRupiah(trx.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectTransaction(trx)}
                          className="cursor-pointer px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5"
                          title="Lihat dan Cetak Ulang Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Lihat Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">Belum ada transaksi</p>
                    <p className="text-[11px] text-slate-400">
                      Selesaikan transaksi pertama Anda melalui menu Kasir Vision.
                    </p>
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
