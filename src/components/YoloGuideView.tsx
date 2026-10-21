import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Server,
  MonitorPlay,
  Terminal,
  FileCode,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  Globe,
  Package,
  GitBranch,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  STREAMLIT_APP_CODE,
  STREAMLIT_REQUIREMENTS_TXT,
  YOLO_API_CODE,
} from '../utils/yoloService';

interface YoloGuideViewProps {
  onGoToPos: () => void;
  onOpenSettings: () => void;
}

type FileKey = 'yolo_api.py' | 'streamlit_app.py' | 'requirements.txt';

export const YoloGuideView: React.FC<YoloGuideViewProps> = ({
  onGoToPos,
  onOpenSettings,
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileKey>('yolo_api.py');

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const fileContents: Record<FileKey, string> = {
    'yolo_api.py': YOLO_API_CODE,
    'streamlit_app.py': STREAMLIT_APP_CODE,
    'requirements.txt': STREAMLIT_REQUIREMENTS_TXT,
  };

  const fileMeta: Record<FileKey, { label: string; color: string; badge: string; desc: string }> = {
    'yolo_api.py': {
      label: 'yolo_api.py',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badge: 'FastAPI',
      desc: 'REST backend untuk React — port 8001',
    },
    'streamlit_app.py': {
      label: 'streamlit_app.py',
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      badge: 'Streamlit',
      desc: 'Aplikasi kasir standalone — port 8501',
    },
    'requirements.txt': {
      label: 'requirements.txt',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      badge: 'Dependencies',
      desc: 'Semua library Python yang dibutuhkan',
    },
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Google Colab (.pt) ➔ VisionPOS Backend ➔ React Kasir
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Panduan Lengkap Integrasi & Deploy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan model <code className="font-mono text-slate-800">best.pt</code> hasil training ke React frontend melalui FastAPI,
              atau jalankan Streamlit sebagai aplikasi kasir mandiri.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSettings}
              className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Pengaturan Mode</span>
            </button>
            <button
              type="button"
              onClick={onGoToPos}
              className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Buka Kasir</span>
            </button>
          </div>
        </div>

        {/* ── Dua jalur integrasi ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
          {/* Jalur A: FastAPI */}
          <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Jalur A — FastAPI + React (Direkomendasikan)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed mb-3">
              React mengirim frame kamera ke <code className="font-mono bg-white px-1 rounded">yolo_api.py</code> via HTTP.
              Cocok untuk integrasi penuh dengan UI kasir React yang sudah ada.
            </p>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-900">
                <ChevronRight className="w-3 h-3" />
                <span>React <code className="bg-white px-1 rounded">localhost:3000</code></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-900">
                <ChevronRight className="w-3 h-3" />
                <span>FastAPI <code className="bg-white px-1 rounded">localhost:8001/detect</code></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-900">
                <ChevronRight className="w-3 h-3" />
                <span>Model <code className="bg-white px-1 rounded">best.pt</code></span>
              </div>
            </div>
          </div>

          {/* Jalur B: Streamlit */}
          <div className="p-4 rounded-xl border-2 border-sky-200 bg-sky-50">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-sky-900">Jalur B — Streamlit Standalone</span>
            </div>
            <p className="text-[11px] text-sky-800 leading-relaxed mb-3">
              Aplikasi kasir lengkap dalam satu file Python. Tidak perlu Node.js atau React.
              Bisa langsung deploy ke Streamlit Community Cloud (gratis).
            </p>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-sky-900">
                <ChevronRight className="w-3 h-3" />
                <span>Streamlit <code className="bg-white px-1 rounded">localhost:8501</code></span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-900">
                <ChevronRight className="w-3 h-3" />
                <span>Model <code className="bg-white px-1 rounded">best.pt</code></span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-900">
                <ChevronRight className="w-3 h-3" />
                <span>Deploy ke <code className="bg-white px-1 rounded">share.streamlit.io</code></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── JALUR A: FASTAPI + REACT ─────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">A</div>
          <h3 className="text-sm font-bold text-slate-900">Setup FastAPI Backend + React (Lokal)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              step: '1',
              color: 'bg-emerald-100 text-emerald-800',
              title: 'Unduh best.pt dari Colab',
              body: (
                <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono leading-relaxed">
                  runs/detect/train/<br />weights/best.pt
                </code>
              ),
            },
            {
              step: '2',
              color: 'bg-blue-100 text-blue-800',
              title: 'Letakkan di Folder Proyek',
              body: (
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  Taruh <code className="font-mono text-slate-700">best.pt</code> satu folder dengan{' '}
                  <code className="font-mono text-slate-700">yolo_api.py</code>.
                </p>
              ),
            },
            {
              step: '3',
              color: 'bg-amber-100 text-amber-800',
              title: 'Install Library Python',
              body: (
                <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono">
                  pip install -r requirements_streamlit.txt
                </code>
              ),
            },
            {
              step: '4',
              color: 'bg-violet-100 text-violet-800',
              title: 'Jalankan FastAPI',
              body: (
                <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono leading-relaxed">
                  uvicorn yolo_api:app<br />--port 8001 --reload
                </code>
              ),
            },
          ].map(({ step, color, title, body }) => (
            <div key={step} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center font-bold text-xs mb-2`}>
                {step}
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{title}</h4>
              {body}
            </div>
          ))}
        </div>

        {/* Langkah 5: Hubungkan di React */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1.5">Hubungkan React ke FastAPI</h4>
              <p className="text-[11px] text-slate-500 mb-2">
                Di React, buka <strong>Pengaturan Mode</strong> (ikon ⚙️ di navbar) → pilih{' '}
                <strong>Streamlit / Python Server</strong> → set URL ke:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="font-mono text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-emerald-800 font-bold">
                  http://localhost:8001/detect
                </code>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Klik <strong>Tes Ping</strong> → harus muncul ✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── JALUR B: STREAMLIT STANDALONE ────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">B</div>
          <h3 className="text-sm font-bold text-slate-900">Setup Streamlit Standalone (Lokal)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: '1', color: 'bg-emerald-100 text-emerald-800',
              title: 'Install & Letakkan best.pt',
              body: <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono">
                pip install -r requirements_streamlit.txt
              </code>,
            },
            {
              step: '2', color: 'bg-sky-100 text-sky-800',
              title: 'Jalankan Streamlit',
              body: <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono">
                streamlit run streamlit_app.py
              </code>,
            },
            {
              step: '3', color: 'bg-violet-100 text-violet-800',
              title: 'Buka di Browser',
              body: <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Streamlit otomatis membuka <code className="font-mono text-slate-700">localhost:8501</code> di browser.
              </p>,
            },
          ].map(({ step, color, title, body }) => (
            <div key={step} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center font-bold text-xs mb-2`}>
                {step}
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{title}</h4>
              {body}
            </div>
          ))}
        </div>
      </div>

      {/* ── DEPLOY KE CLOUD ──────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">Deploy Online Gratis (Streamlit Community Cloud)</h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Streamlit Community Cloud menyediakan hosting gratis dengan URL HTTPS publik. Cocok untuk demo atau penggunaan ringan.
          <strong className="text-slate-700"> Model <code className="font-mono">best.pt</code> harus ikut di-upload ke GitHub</strong> (batas repo ~100 MB).
          Untuk model yang lebih besar, gunakan Git LFS atau simpan di Hugging Face Hub.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { step: '1', title: 'Buat Repo GitHub', body: 'Buat repositori baru (public/private) misal yolo-kasir-streamlit.' },
            { step: '2', title: 'Upload File', body: 'Upload streamlit_app.py, requirements_streamlit.txt, dan best.pt ke repo.' },
            { step: '3', title: 'Rename requirements', body: 'Ganti nama file menjadi requirements.txt agar Streamlit Cloud mengenalinya.' },
            { step: '4', title: 'Buka share.streamlit.io', body: 'Login dengan akun GitHub → klik New App → pilih repo.' },
            { step: '5', title: 'Set Main File & Deploy', body: 'Main file path: streamlit_app.py → klik Deploy! Tunggu 1-2 menit.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-5 h-5 rounded bg-violet-100 text-violet-800 flex items-center justify-center font-bold text-[10px] mb-2">
                {step}
              </div>
              <h4 className="text-[11px] font-bold text-slate-900 mb-1">{title}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="https://share.streamlit.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka share.streamlit.io
          </a>
          <a
            href="https://docs.streamlit.io/streamlit-community-cloud/deploy-your-app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Dokumentasi Deploy
          </a>
        </div>

        {/* Catatan model besar */}
        <div className="mt-4 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Catatan model besar (&gt; 100 MB):</strong> Gunakan{' '}
            <a href="https://git-lfs.github.com" target="_blank" rel="noreferrer" className="underline">Git LFS</a> untuk file{' '}
            <code className="font-mono">best.pt</code> yang besar, atau upload model ke{' '}
            <a href="https://huggingface.co/models" target="_blank" rel="noreferrer" className="underline">Hugging Face Hub</a>{' '}
            dan load via <code className="font-mono">hf_hub_download()</code> di awal script.
          </div>
        </div>
      </div>

      {/* ── DEPLOY REACT FRONTEND ──────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Deploy React Frontend (Vercel / Netlify)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Build React', body: <code className="block mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono">npm run build</code> },
            { step: '2', title: 'Push ke GitHub', body: <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Commit folder dist/ atau seluruh proyek ke repositori GitHub.</p> },
            { step: '3', title: 'Hubungkan Vercel', body: <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Di <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline text-blue-600">vercel.com</a> → Import repo → framework Vite → Deploy.</p> },
            { step: '4', title: 'Set API URL', body: <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Di pengaturan YOLO, set URL ke alamat FastAPI yang sudah berjalan di server/VPS publik.</p> },
          ].map(({ step, title, body }) => (
            <div key={step} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] mb-2">{step}</div>
              <h4 className="text-[11px] font-bold text-slate-900 mb-1">{title}</h4>
              {body}
            </div>
          ))}
        </div>
      </div>

      {/* ── CODE VIEWER ──────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Source Code Backend</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(fileContents) as FileKey[]).map((fname) => (
              <button
                key={fname}
                type="button"
                onClick={() => setSelectedFile(fname)}
                className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 ${selectedFile === fname
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
              onClick={() => handleCopy(selectedFile, fileContents[selectedFile])}
              className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedFile === selectedFile ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === selectedFile ? 'Tersalin!' : `Salin ${selectedFile}`}</span>
            </button>
          </div>
        </div>

        {/* File badge */}
        <div className={`text-[11px] px-3 py-2 rounded-lg border ${fileMeta[selectedFile].color}`}>
          <strong>{fileMeta[selectedFile].badge}</strong> — {fileMeta[selectedFile].desc}
        </div>

        <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto max-h-[480px] border border-slate-800 leading-relaxed">
          {fileContents[selectedFile]}
        </pre>
      </div>

    </div>
  );
};
