import React, { useState } from 'react';
import {
  X,
  QrCode,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CartItem, PaymentMethod, Transaction } from '../types/pos';
import { formatRupiah, generateTransactionNumber } from '../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  onPaymentSuccess: (transaction: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  tax,
  discount,
  total,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');
  const [cashGiven, setCashGiven] = useState<number>(total);
  const [cashierName] = useState<string>('Kasir 01');

  if (!isOpen) return null;

  const change = Math.max(0, cashGiven - total);
  const isCashInsufficient = selectedMethod === 'cash' && cashGiven < total;

  const handleCompleteTransaction = () => {
    const transaction: Transaction = {
      id: `trx_${Date.now()}`,
      transactionNumber: generateTransactionNumber(),
      timestamp: Date.now(),
      items: [...items],
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: selectedMethod,
      amountPaid: selectedMethod === 'cash' ? cashGiven : total,
      change: selectedMethod === 'cash' ? change : 0,
      cashierName,
    };
    onPaymentSuccess(transaction);
  };

  const cashSuggestions = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000,
    200000
  ].filter((val, idx, arr) => val >= total && arr.indexOf(val) === idx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-500">
              Pilih metode pembayaran untuk menyelesaikan transaksi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">Total yang harus dibayar:</span>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatRupiah(total)}
          </span>
        </div>

        {/* Payment Method Tabs */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('qris')}
              className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'qris'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-semibold block">QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMethod('cash');
                setCashGiven(total);
              }}
              className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'cash'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-semibold block">Tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'card'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-semibold block">Debit/Kredit</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('ewallet')}
              className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'ewallet'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-semibold block">E-Wallet</span>
            </button>
          </div>

          {/* Tab Content: QRIS */}
          {selectedMethod === 'qris' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <div className="inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                {/* Simulated QR Code Graphic */}
                <div className="w-40 h-40 bg-slate-900 p-2 rounded-lg flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-10 h-10 border-4 border-white rounded bg-slate-900" />
                    <div className="w-10 h-10 border-4 border-white rounded bg-slate-900" />
                  </div>
                  <div className="text-center text-[10px] text-white font-mono tracking-widest uppercase">
                    QRIS VISIONPOS
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-10 h-10 border-4 border-white rounded bg-slate-900" />
                    <div className="w-6 h-6 bg-white rounded-xs" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Scan QRIS menggunakan BCA, Mandiri, GoPay, OVO, ShopeePay
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  NMID: ID1029384819283 · Merchant: VisionPOS Smart Cashier
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Cash (Tunai) */}
          {selectedMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Uang Diterima dari Pembeli (Rp)
                </label>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {cashSuggestions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(amt)}
                    className="cursor-pointer px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                  >
                    {amt === total ? 'Uang Pas' : formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Uang Kembalian:</span>
                <span className="text-base font-bold font-mono tabular-nums text-emerald-600">
                  {formatRupiah(change)}
                </span>
              </div>

              {isCashInsufficient && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Jumlah uang tunai kurang {formatRupiah(total - cashGiven)}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Card */}
          {selectedMethod === 'card' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">
                Silakan gesek atau masukkan kartu ke Mesin EDC
              </p>
              <p className="text-[11px] text-slate-500">
                Mendukung GPN, Visa, Mastercard, JCB, Contactless Tap
              </p>
            </div>
          )}

          {/* Tab Content: E-Wallet */}
          {selectedMethod === 'ewallet' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-600">
                Masukkan nomor ponsel pelanggan yang terdaftar di GoPay / DANA / OVO:
              </p>
              <input
                type="tel"
                placeholder="Contoh: 0812-3456-7890"
                defaultValue="081298765432"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Permintaan pembayaran push notification akan dikirim langsung ke aplikasi e-wallet pelanggan.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleCompleteTransaction}
            disabled={isCashInsufficient}
            className="cursor-pointer px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm ml-auto"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Selesaikan & Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
