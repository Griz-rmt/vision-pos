import React from 'react';
import { Printer, Download, Plus, Check } from 'lucide-react';
import { Transaction } from '../types/pos';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  onNewTransaction,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const lines = [
      '========================================',
      '           VISIONPOS SMART STORE        ',
      '       KASIR COMPUTER VISION AI YOLO    ',
      '          Jl. Sudirman No. 88 Jakarta   ',
      '========================================',
      `No. Transaksi : ${transaction.transactionNumber}`,
      `Waktu         : ${formatDateTime(transaction.timestamp)}`,
      `Kasir         : ${transaction.cashierName}`,
      '----------------------------------------',
      ...transaction.items.map(
        (it) =>
          `${it.product.name.slice(0, 24).padEnd(24)} x${it.quantity} ${formatRupiah(
            it.product.price * it.quantity
          ).padStart(10)}`
      ),
      '----------------------------------------',
      `Subtotal      : ${formatRupiah(transaction.subtotal)}`,
      `PPN (11%)     : ${formatRupiah(transaction.tax)}`,
      `Diskon        : -${formatRupiah(transaction.discount)}`,
      `TOTAL AKHIR   : ${formatRupiah(transaction.total)}`,
      '----------------------------------------',
      `Metode Bayar  : ${transaction.paymentMethod.toUpperCase()}`,
      `Bayar         : ${formatRupiah(transaction.amountPaid)}`,
      `Kembali       : ${formatRupiah(transaction.change)}`,
      '========================================',
      '    Terima kasih atas kunjungan Anda!   ',
      '   Didukung oleh YOLO Computer Vision   ',
      '========================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk_${transaction.transactionNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Top Banner */}
        <div className="bg-emerald-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 bg-white/20 p-1 rounded-full" />
            <span className="text-xs font-bold">Transaksi Sukses</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-100">
            {transaction.transactionNumber}
          </span>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          id="printable-receipt"
          className="p-6 bg-white font-mono text-xs text-slate-800 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-sm tracking-wide text-slate-900">VISIONPOS SMART STORE</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated Computer Vision Checkout</p>
            <p className="text-[10px] text-slate-400">Jl. Jendral Sudirman No. 88, Jakarta</p>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-200">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-semibold text-slate-900">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDateTime(transaction.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.cashierName} (Auto-CV)</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 py-1">
            {transaction.items.map((item) => (
              <div key={item.product.id} className="text-[11px]">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span className="truncate pr-2">{item.product.name}</span>
                  <span className="tabular-nums font-mono shrink-0">
                    {formatRupiah(item.product.price * item.quantity)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>
                    {item.quantity} x {formatRupiah(item.product.price)}
                  </span>
                  <span className="font-mono text-slate-400">[{item.product.yoloClass}]</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatRupiah(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>PPN (11%):</span>
              <span className="tabular-nums">{formatRupiah(transaction.tax)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon:</span>
                <span className="tabular-nums">-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs text-slate-900 pt-1.5 border-t border-slate-300">
              <span>TOTAL:</span>
              <span className="tabular-nums text-sm">{formatRupiah(transaction.total)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="pt-2 border-t border-dashed border-slate-200 text-[11px] space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="uppercase font-semibold text-slate-900">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Diterima:</span>
              <span className="tabular-nums">{formatRupiah(transaction.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian:</span>
              <span className="tabular-nums font-semibold text-slate-900">
                {formatRupiah(transaction.change)}
              </span>
            </div>
          </div>

          {/* Footer Barcode Simulator */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center">
            <div className="h-9 w-48 mx-auto bg-slate-900 flex items-center justify-around px-2 py-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="h-full bg-white"
                  style={{ width: `${(i % 3) + 1}px`, margin: '0 1px' }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Terima Kasih Atas Kunjungan Anda!
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Struk</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="cursor-pointer flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh TXT</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNewTransaction();
            }}
            className="cursor-pointer w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
