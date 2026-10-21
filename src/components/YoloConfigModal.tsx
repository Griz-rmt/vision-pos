import React, { useState } from 'react';
import {
  X,
  Sliders,
  Check,
  Copy,
  Layers,
  Code2,
  FileCode,
  Terminal,
  CheckCircle2,
  Play
} from 'lucide-react';
import { YoloConfig } from '../types/pos';
import {
  STREAMLIT_APP_CODE,
  STREAMLIT_REQUIREMENTS_TXT,
  YOLO_API_CODE,
  fetchModelClasses
} from '../utils/yoloService';

interface YoloConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: YoloConfig;
  onSaveConfig: (newConfig: YoloConfig) => void;
  onImportClassesToCatalog?: (classes: string[]) => void;
}

export const YoloConfigModal: React.FC<YoloConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onImportClassesToCatalog,
}) => {
  const [formConfig, setFormConfig] = useState<YoloConfig>(config);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'settings' | 'streamlit_files'>('settings');
  const [selectedFileCode, setSelectedFileCode] = useState<'streamlit_app.py' | 'requirements.txt' | 'yolo_api.py'>('yolo_api.py');

  const [isFetchingClasses, setIsFetchingClasses] = useState(false);
  const [fetchedClasses, setFetchedClasses] = useState<string[]>([]);
  const [fetchClassesMsg, setFetchClassesMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleTestPing = async () => {
    if (formConfig.mode === 'simulated') {
      setPingStatus('success');
      setPingMessage('Mode Simulasi aktif! Tidak memerlukan backend eksternal.');
      return;
    }

    setPingStatus('testing');
    setPingMessage('Menghubungi server Streamlit / API...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const baseUrl = formConfig.apiUrl.replace(/\/detect\/?$/, '');
      const testUrl = baseUrl || formConfig.apiUrl;
      const res = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setPingStatus('success');
        setPingMessage(`Koneksi berhasil! Server aktif (HTTP ${res.status}).`);
      } else {
        setPingStatus('failed');
        setPingMessage(`Server dapat dijangkau (status ${res.status} ${res.statusText})`);
      }
    } catch (err: unknown) {
      setPingStatus('failed');
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi server';
      setPingMessage(`Koneksi gagal: ${msg}. Pastikan Streamlit lokal sedang berjalan.`);
    }
  };

  const handleFetchClasses = async () => {
    setIsFetchingClasses(true);
    setFetchClassesMsg(null);
    const res = await fetchModelClasses(formConfig.apiUrl);
    setIsFetchingClasses(false);

    if (res.error) {
      setFetchClassesMsg(`Gagal: ${res.error}.`);
    } else {
      setFetchedClasses(res.classes);
      setFetchClassesMsg(`Berhasil menemukan ${res.classes.length} kelas di model .pt.`);
    }
  };

  const handleImportToCatalog = () => {
    if (onImportClassesToCatalog && fetchedClasses.length > 0) {
      onImportClassesToCatalog(fetchedClasses);
      setFetchClassesMsg(`Sukses! ${fetchedClasses.length} kelas ditambahkan ke katalog kasir.`);
    }
  };

  const handleSave = () => {
    onSaveConfig(formConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Model YOLO (.pt) Streamlit
              </h3>
              <p className="text-xs text-slate-500">
                Pengaturan integrasi file model .pt hasil Colab dengan Streamlit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-4 pt-2 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`cursor-pointer pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'settings'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan Model & Endpoint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('streamlit_files')}
            className={`cursor-pointer pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'streamlit_files'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kode Script Streamlit (streamlit_app.py)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'settings' ? (
            <>
              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Pilih Mode Sumber Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormConfig({ ...formConfig, mode: 'simulated' })}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${formConfig.mode === 'simulated'
                      ? 'border-slate-900 bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Mode Simulasi (Browser Demo)</span>
                      {formConfig.mode === 'simulated' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Langsung berfungsi di peramban untuk mencoba fitur kasir dan visualisasi kotak deteksi tanpa server.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormConfig({ ...formConfig, mode: 'http_api' })}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${formConfig.mode === 'http_api'
                      ? 'border-slate-900 bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Streamlit / Python Server</span>
                      {formConfig.mode === 'http_api' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Kirim frame kamera ke server Python lokal atau Streamlit yang memuat file <code className="font-mono text-slate-800">best.pt</code> Anda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoint URL Input */}
              {formConfig.mode === 'http_api' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-800">
                    URL Endpoint Inference YOLO
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formConfig.apiUrl}
                      onChange={(e) => setFormConfig({ ...formConfig, apiUrl: e.target.value })}
                      placeholder="http://localhost:8000/detect"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={pingStatus === 'testing'}
                      className="cursor-pointer px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {pingStatus === 'testing' ? 'Mengetes...' : 'Tes Ping'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="text-slate-500">Preset cepat:</span>
                    <button
                      type="button"
                      onClick={() => setFormConfig({ ...formConfig, apiUrl: 'http://localhost:8001/detect' })}
                      className="cursor-pointer font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100"
                    >
                      localhost:8001/detect (FastAPI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormConfig({ ...formConfig, apiUrl: 'http://localhost:8501' })}
                      className="cursor-pointer font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100"
                    >
                      Streamlit Default (8501)
                    </button>
                  </div>

                  {pingMessage && (
                    <p
                      className={`text-[11px] p-2 rounded-lg border ${pingStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : pingStatus === 'failed'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                      {pingMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Confidence Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Ambang Batas Kepercayaan (Confidence Threshold)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {Math.round(formConfig.confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={formConfig.confidenceThreshold}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, confidenceThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Auto Add to Cart Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Auto-Masukkan ke Keranjang Kasir
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Otomatis tambahkan barang ke kasir saat objek terdeteksi dengan tingkat keyakinan tinggi.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.autoAddToCart}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, autoAddToCart: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>
            </>
          ) : (
            /* Streamlit Files Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    File Backend VisionPOS
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dua cara menjalankan inference YOLO — pilih salah satu sesuai kebutuhan.
                  </p>
                </div>
              </div>

              {/* Quick Run Instructions */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                <span className="text-slate-400 text-[10px]"># Opsi A – FastAPI (direkomendasikan untuk React):</span>
                <p className="text-emerald-400 font-bold">uvicorn yolo_api:app --host 0.0.0.0 --port 8001 --reload</p>
                <span className="text-slate-400 text-[10px] block pt-1"># Opsi B – Streamlit standalone:</span>
                <p className="text-sky-400 font-bold">streamlit run streamlit_app.py</p>
              </div>

              {/* File selector pill tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['yolo_api.py', 'streamlit_app.py', 'requirements.txt'] as const).map((fname) => (
                  <button
                    key={fname}
                    type="button"
                    onClick={() => setSelectedFileCode(fname)}
                    className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 ${selectedFileCode === fname
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{fname}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const contentMap: Record<string, string> = {
                      'yolo_api.py': YOLO_API_CODE,
                      'streamlit_app.py': STREAMLIT_APP_CODE,
                      'requirements.txt': STREAMLIT_REQUIREMENTS_TXT,
                    };
                    handleCopyCode(selectedFileCode, contentMap[selectedFileCode] || '');
                  }}
                  className="cursor-pointer ml-auto px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedFile === selectedFileCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedFile === selectedFileCode ? 'Tersalin!' : `Salin ${selectedFileCode}`}</span>
                </button>
              </div>

              {/* Badge keterangan file */}
              {selectedFileCode === 'yolo_api.py' && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  ⚡ <strong>FastAPI backend</strong> — untuk dihubungkan ke React. Set URL ke{' '}
                  <code className="font-mono">http://localhost:8001/detect</code> di pengaturan mode.
                </p>
              )}
              {selectedFileCode === 'streamlit_app.py' && (
                <p className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                  🎈 <strong>Streamlit standalone</strong> — aplikasi kasir lengkap terpisah di{' '}
                  <code className="font-mono">localhost:8501</code>. Tidak perlu React.
                </p>
              )}
              {selectedFileCode === 'requirements.txt' && (
                <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  📦 <strong>requirements_streamlit.txt</strong> — mencakup dependensi untuk Streamlit <em>dan</em> FastAPI sekaligus.
                </p>
              )}

              {/* Code display */}
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {selectedFileCode === 'yolo_api.py'
                    ? YOLO_API_CODE
                    : selectedFileCode === 'streamlit_app.py'
                      ? STREAMLIT_APP_CODE
                      : STREAMLIT_REQUIREMENTS_TXT}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="cursor-pointer px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm"
          >
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};
