# VisionPOS — Kasir Otomatis AI YOLO

Aplikasi point-of-sale (POS) berbasis computer vision yang mendeteksi produk secara otomatis menggunakan model YOLO `.pt` hasil training Google Colab.

Tersedia dalam **dua mode operasi**:

| Mode | Teknologi | Untuk Siapa |
|------|-----------|-------------|
| **Jalur A** | React + FastAPI (`yolo_api.py`) | Integrasi penuh browser + AI backend |
| **Jalur B** | Streamlit standalone | Deploy cepat, tanpa Node.js |

---

## Fitur Utama

- 📹 Deteksi produk real-time via webcam atau upload foto
- 🎯 Bounding box dengan label nama produk + confidence %
- 🛒 Keranjang kasir: tambah/hapus/kuantitas
- 💳 Pembayaran: QRIS, Tunai (kembalian otomatis), Debit, E-Wallet
- 🧾 Struk transaksi (tampil di layar + download `.txt`)
- 📦 Katalog produk: CRUD, 14 produk default
- 📑 Riwayat transaksi dengan export CSV
- ⚙️ Sinkronisasi kelas model `.pt` ke katalog kasir otomatis

---

## Struktur Proyek

```
visionpos/
├── src/                        # React/TypeScript frontend
│   ├── components/
│   │   ├── CameraScanner.tsx   # Viewport AI + bounding box canvas
│   │   ├── CartPanel.tsx       # Keranjang belanja
│   │   ├── PaymentModal.tsx    # Modal pembayaran
│   │   ├── ReceiptModal.tsx    # Struk termal
│   │   ├── ProductCatalogView.tsx
│   │   ├── TransactionHistoryView.tsx
│   │   ├── YoloConfigModal.tsx # Pengaturan mode + copy kode backend
│   │   └── YoloGuideView.tsx   # Panduan deploy
│   ├── data/initialProducts.ts # 14 produk default + demo samples
│   ├── types/pos.ts            # TypeScript interfaces
│   └── utils/
│       ├── yoloService.ts      # Logika deteksi (simulated & HTTP API)
│       └── formatters.ts       # Format Rupiah, tanggal, no. transaksi
│
├── yolo_api.py                 # ⚡ FastAPI backend (port 8001)
├── streamlit_app.py            # 🎈 Streamlit standalone (port 8501)
├── requirements_streamlit.txt  # Python dependencies
├── best.pt                     # ← letakkan model YOLO kamu di sini
│
├── package.json                # Node.js / React
└── vite.config.ts
```

---

## Prasyarat

### Python (untuk backend)
- Python 3.10+
- `pip install -r requirements_streamlit.txt`

### Node.js (untuk React frontend)
- Node.js 18+ dan npm
- `npm install`

---

## JALUR A — FastAPI + React (Direkomendasikan)

Gunakan jalur ini jika kamu ingin kamera live dari browser React terhubung ke model YOLO kamu.

### 1. Siapkan model

```bash
# Letakkan file best.pt dari Google Colab di folder root proyek
# Contoh struktur folder:
# visionpos/
#   best.pt          ← di sini
#   yolo_api.py
#   streamlit_app.py
```

### 2. Install dependencies Python

```bash
pip install -r requirements_streamlit.txt
```

### 3. Jalankan FastAPI backend

```bash
uvicorn yolo_api:app --host 0.0.0.0 --port 8001 --reload
```

Buka `http://localhost:8001/health` — harus tampil:
```json
{ "status": "ok", "model": "best.pt", "classes_count": 8 }
```

### 4. Jalankan React frontend

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`

### 5. Hubungkan di UI

1. Di navbar React, klik ikon **⚙️ Pengaturan YOLO**
2. Pilih mode **Streamlit / Python Server**
3. Set URL endpoint ke `http://localhost:8001/detect`
4. Klik **Tes Ping** → pastikan muncul ✅
5. Klik **Simpan Konfigurasi**

Sekarang setiap kali kamu klik **Scan** atau aktifkan auto-scan, frame kamera dikirim ke FastAPI dan hasil deteksi dikembalikan ke React.

### Endpoint FastAPI

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/health` | Status server & model |
| `GET` | `/classes` | Daftar kelas dari model `.pt` |
| `POST` | `/detect` | Inferensi: kirim gambar, terima deteksi |

**Contoh request `/detect`:**
```bash
curl -X POST http://localhost:8001/detect \
  -F "file=@foto_produk.jpg" \
  -F "confidence=0.5"
```

**Contoh response:**
```json
{
  "status": "ok",
  "count": 2,
  "latencyMs": 87,
  "detections": [
    { "class": "indomie_goreng", "confidence": 0.94, "bbox": [0.25, 0.30, 0.75, 0.70] },
    { "class": "coca_cola",      "confidence": 0.88, "bbox": [0.10, 0.60, 0.55, 0.90] }
  ]
}
```

> **Format bbox**: `[ymin, xmin, ymax, xmax]` — semua ternormalisasi 0–1 relatif terhadap ukuran gambar.

---

## JALUR B — Streamlit Standalone

Gunakan jalur ini untuk demo cepat atau deploy ke cloud tanpa React.

### Lokal

```bash
pip install -r requirements_streamlit.txt
streamlit run streamlit_app.py
# Buka http://localhost:8501
```

### Deploy ke Streamlit Community Cloud (Gratis)

1. **Buat repositori GitHub** (public/private), misal `yolo-kasir-visionpos`

2. **Upload file-file berikut ke repo:**
   ```
   streamlit_app.py
   requirements_streamlit.txt   ← rename menjadi requirements.txt
   best.pt                      ← model kamu (maks ~100 MB)
   ```

3. **Jika model > 100 MB**, gunakan Git LFS:
   ```bash
   git lfs install
   git lfs track "*.pt"
   git add .gitattributes best.pt
   git commit -m "add model with LFS"
   git push
   ```
   Atau simpan model di [Hugging Face Hub](https://huggingface.co/models) dan load di script:
   ```python
   from huggingface_hub import hf_hub_download
   model_path = hf_hub_download(repo_id="username/repo", filename="best.pt")
   ```

4. **Buka [share.streamlit.io](https://share.streamlit.io)**
   - Login dengan GitHub
   - Klik **New App**
   - Pilih repo dan branch
   - Main file path: `streamlit_app.py`
   - Klik **Deploy!**

5. Dalam 1–2 menit, aplikasi kasir kamu akan live di URL:
   ```
   https://username-yolo-kasir-visionpos-streamlit-app-xxxxx.streamlit.app
   ```

---

## JALUR A + CLOUD — FastAPI di VPS + React di Vercel

Untuk setup produksi penuh:

### Deploy FastAPI ke VPS (Ubuntu)

```bash
# Di server VPS
git clone https://github.com/kamu/visionpos.git
cd visionpos
pip install -r requirements_streamlit.txt
# Letakkan best.pt di folder proyek

# Jalankan sebagai service dengan systemd atau screen/tmux
uvicorn yolo_api:app --host 0.0.0.0 --port 8001
```

Aktifkan firewall untuk port 8001, dan gunakan Nginx sebagai reverse proxy jika ingin HTTPS.

### Deploy React ke Vercel

```bash
npm run build
# Push ke GitHub, lalu import di vercel.com
# Framework: Vite
# Build command: npm run build
# Output dir: dist
```

Setelah deploy, update URL API di konfigurasi YOLO menjadi alamat server VPS kamu (misal `https://api.kasirku.com/detect`).

---

## Variabel Environment

Untuk `yolo_api.py`, bisa set path model lewat env var:

```bash
YOLO_MODEL_PATH=weights/model_v3.pt uvicorn yolo_api:app --port 8001
```

---

## Menambah Produk Baru

### Via UI React
1. Buka tab **Katalog Produk**
2. Klik **Tambah Produk Baru**
3. Isi nama, kelas YOLO (harus sama persis dengan label di model `.pt`), harga, kategori

### Via Sinkronisasi Otomatis
1. Pastikan FastAPI berjalan dan terhubung
2. Di **Pengaturan YOLO** → klik **Fetch Kelas dari Model**
3. Kelas baru akan muncul → klik **Import ke Katalog**

### Via Streamlit
Di sidebar Streamlit, klik **Sinkronkan ke Katalog Kasir** — semua kelas dari model `.pt` yang belum ada di katalog akan ditambahkan otomatis dengan harga default Rp 10.000.

---

## Mode Simulasi (Tanpa Backend)

React bisa berjalan sepenuhnya **tanpa backend Python** dalam mode simulasi bawaan:

- Di **Pengaturan YOLO** → pilih **Mode Simulasi (Browser Demo)**
- Demo deteksi menggunakan gambar sampel yang sudah disertakan
- Bounding box dan keranjang kasir berfungsi penuh

Cocok untuk presentasi atau testing UI tanpa perlu menyalakan server.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `best.pt not found` | Pastikan file ada di folder yang sama dengan `yolo_api.py` / `streamlit_app.py` |
| CORS error di browser | FastAPI sudah dikonfigurasi `allow_origins=["*"]` — pastikan server berjalan di port yang benar |
| Tes Ping gagal | Periksa apakah `uvicorn` berjalan; coba akses `http://localhost:8001/health` langsung di browser |
| Kamera tidak muncul | Browser memerlukan izin kamera; pastikan akses kamera diizinkan di pengaturan browser |
| `ultralytics` tidak ditemukan | Jalankan `pip install ultralytics` |
| Model fallback ke `yolov8n.pt` | `best.pt` tidak ditemukan di path yang dikonfigurasi; periksa path di sidebar/input model |
| Upload model besar ke Streamlit Cloud | Gunakan Git LFS atau Hugging Face Hub (lihat bagian deploy di atas) |

---

## Lisensi

MIT License — bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun komersial.
