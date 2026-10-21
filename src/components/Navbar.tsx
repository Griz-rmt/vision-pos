import React from 'react';
import { Camera, Sliders, ShoppingBag, Database, History, BookOpen } from 'lucide-react';
import { YoloConfig } from '../types/pos';

interface NavbarProps {
  activeTab: 'pos' | 'catalog' | 'history' | 'guide';
  setActiveTab: (tab: 'pos' | 'catalog' | 'history' | 'guide') => void;
  yoloConfig: YoloConfig;
  onOpenYoloSettings: () => void;
  cartItemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  yoloConfig,
  onOpenYoloSettings,
  cartItemCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <Camera className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
              VisionPOS
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
              Kasir Otomatis AI YOLO
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed text) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              activeTab === 'pos'
                ? 'text-slate-900 border-b-2 border-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Kasir Vision</span>
            {cartItemCount > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              activeTab === 'catalog'
                ? 'text-slate-900 border-b-2 border-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Katalog & Kelas YOLO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              activeTab === 'history'
                ? 'text-slate-900 border-b-2 border-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              activeTab === 'guide'
                ? 'text-slate-900 border-b-2 border-slate-900 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Integrasi YOLO Streamlit</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action - YOLO Configuration */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenYoloSettings}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Konfigurasi Endpoint YOLO"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Mode: {yoloConfig.mode === 'simulated' ? 'Simulasi' : 'Streamlit / API'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
