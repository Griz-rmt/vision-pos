import { DetectedItem, Product, YoloConfig, BoundingBox } from '../types/pos';

export interface YoloDetectionResponse {
  status?: string;
  detections: {
    class: string;
    confidence: number;
    bbox: [number, number, number, number] | { ymin: number; xmin: number; ymax: number; xmax: number };
  }[];
  latencyMs?: number;
  modelVersion?: string;
  count?: number;
}

export interface ModelClassesResponse {
  status: string;
  classes: Record<string, string> | string[];
  count: number;
  model: string;
}

/**
 * Capture frame from video/image element to JPEG Blob
 */
export async function captureFrameAsBlob(
  element: HTMLVideoElement | HTMLImageElement
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const width = 'videoWidth' in element ? element.videoWidth : element.naturalWidth;
  const height = 'videoHeight' in element ? element.videoHeight : element.naturalHeight;

  if (!width || !height) return null;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(element, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
  });
}

/**
 * Send frame to real YOLO HTTP API endpoint or simulate
 */
export async function detectObjects(
  element: HTMLVideoElement | HTMLImageElement,
  config: YoloConfig,
  productsMap: Map<string, Product>,
  demoDetections?: { yoloClass: string; confidence: number; bbox: BoundingBox }[]
): Promise<{ detections: DetectedItem[]; latencyMs: number; error?: string }> {
  const startTime = performance.now();

  // Mode 1: Simulated Mode (Works immediately without external server)
  if (config.mode === 'simulated') {
    await new Promise((resolve) => setTimeout(resolve, 140 + Math.random() * 80));

    if (demoDetections && demoDetections.length > 0) {
      const items: DetectedItem[] = demoDetections
        .filter((d) => d.confidence >= config.confidenceThreshold)
        .map((d, index) => {
          const jitter = (Math.random() - 0.5) * 0.005;
          return {
            id: `det_${d.yoloClass}_${index}_${Date.now()}`,
            yoloClass: d.yoloClass,
            confidence: Math.min(0.99, Math.max(0.7, d.confidence + (Math.random() - 0.5) * 0.04)),
            bbox: {
              ymin: Math.max(0, d.bbox.ymin + jitter),
              xmin: Math.max(0, d.bbox.xmin + jitter),
              ymax: Math.min(1, d.bbox.ymax + jitter),
              xmax: Math.min(1, d.bbox.xmax + jitter)
            },
            product: productsMap.get(d.yoloClass),
            timestamp: Date.now()
          };
        });

      return {
        detections: items,
        latencyMs: Math.round(performance.now() - startTime)
      };
    }

    const sampleClasses = ['indomie_goreng', 'coca_cola', 'oreo_box', 'evian_water'];
    const randomClass = sampleClasses[Math.floor(Math.random() * sampleClasses.length)];
    const simulatedItem: DetectedItem = {
      id: `det_${randomClass}_${Date.now()}`,
      yoloClass: randomClass,
      confidence: 0.94,
      bbox: { ymin: 0.25, xmin: 0.3, ymax: 0.75, xmax: 0.7 },
      product: productsMap.get(randomClass),
      timestamp: Date.now()
    };

    return {
      detections: [simulatedItem],
      latencyMs: Math.round(performance.now() - startTime)
    };
  }

  // Mode 2: Live HTTP API (Streamlit backend / FastAPI endpoint)
  try {
    const blob = await captureFrameAsBlob(element);
    if (!blob) {
      throw new Error('Gagal mengambil frame dari video/kamera.');
    }

    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');
    formData.append('confidence', config.confidenceThreshold.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server merespons status ${response.status}: ${response.statusText}`);
    }

    const data: YoloDetectionResponse = await response.json();
    const rawDetections = data.detections || [];

    const parsedDetections: DetectedItem[] = rawDetections.map((d, index) => {
      let bboxNorm: BoundingBox;

      if (Array.isArray(d.bbox)) {
        bboxNorm = {
          ymin: d.bbox[0],
          xmin: d.bbox[1],
          ymax: d.bbox[2],
          xmax: d.bbox[3]
        };
      } else {
        bboxNorm = d.bbox;
      }

      return {
        id: `det_${d.class}_${index}_${Date.now()}`,
        yoloClass: d.class,
        confidence: d.confidence,
        bbox: bboxNorm,
        product: productsMap.get(d.class),
        timestamp: Date.now()
      };
    });

    return {
      detections: parsedDetections.filter((d) => d.confidence >= config.confidenceThreshold),
      latencyMs: Math.round(performance.now() - startTime)
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Koneksi ke endpoint YOLO / Streamlit gagal';
    return {
      detections: [],
      latencyMs: Math.round(performance.now() - startTime),
      error: errorMsg
    };
  }
}

/**
 * Fetch available model classes from the YOLO backend (/classes or /info endpoint)
 */
export async function fetchModelClasses(apiUrl: string): Promise<{ classes: string[]; error?: string }> {
  try {
    const baseUrl = apiUrl.replace(/\/detect\/?$/, '');
    const targetUrl = `${baseUrl}/classes`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Endpoint /classes merespons dengan status ${res.status}`);
    }

    const data: ModelClassesResponse = await res.json();
    let classList: string[] = [];

    if (Array.isArray(data.classes)) {
      classList = data.classes;
    } else if (typeof data.classes === 'object' && data.classes !== null) {
      classList = Object.values(data.classes);
    }

    return { classes: classList };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil kelas model';
    return { classes: [], error: msg };
  }
}

/**
 * streamlit_app.py – standalone Streamlit POS app (ditampilkan di YoloGuideView)
 * File lengkap sudah ada di root proyek; ini versi ringkas untuk copy-paste cepat.
 */
export const STREAMLIT_APP_CODE = `# ==============================================================================
# VISIONPOS – KASIR OTOMATIS AI YOLO  |  streamlit_app.py  (v2)
# Jalankan: streamlit run streamlit_app.py
# Letakkan best.pt di folder yang sama dengan file ini.
# ==============================================================================

import streamlit as st
from PIL import Image, ImageDraw
import numpy as np
import pandas as pd
import datetime
import os

st.set_page_config(
    page_title="VisionPOS - Kasir Otomatis YOLO Streamlit",
    page_icon="🛒",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 1. KATALOG PRODUK & HARGA
DEFAULT_PRODUCTS = {
    "indomie_goreng": {"name": "Indomie Mi Goreng 85g", "price": 3500, "category": "Makanan Instan"},
    "coca_cola": {"name": "Coca-Cola Kaleng 330ml", "price": 8000, "category": "Minuman Dingin"},
    "oreo_box": {"name": "Oreo Vanilla Box 123g", "price": 11500, "category": "Biskuit & Snack"},
    "evian_water": {"name": "Evian Mineral Water 500ml", "price": 18500, "category": "Air Mineral"},
    "cup_noodles": {"name": "Nissin Cup Noodles Seafood", "price": 14500, "category": "Makanan Instan"},
    "nestea_lemon": {"name": "Nestea Lemon Tea 500ml", "price": 7500, "category": "Minuman Teh"},
    "loacker_wafer": {"name": "Loacker Quadratini 125g", "price": 32000, "category": "Biskuit & Snack"},
    "cadbury_fingers": {"name": "Cadbury Fingers 114g", "price": 24000, "category": "Cokelat"},
}

if "products" not in st.session_state:
    st.session_state.products = DEFAULT_PRODUCTS.copy()

if "cart" not in st.session_state:
    st.session_state.cart = {}

if "transactions" not in st.session_state:
    st.session_state.transactions = []

# 2. LOAD MODEL YOLO (.pt)
@st.cache_resource
def load_yolo_model(model_path="best.pt"):
    try:
        from ultralytics import YOLO
        if os.path.exists(model_path):
            return YOLO(model_path), True, f"Model kustom '{model_path}' berhasil dimuat."
        else:
            return YOLO("yolov8n.pt"), False, f"'{model_path}' belum ditemukan. Menggunakan fallback 'yolov8n.pt'."
    except Exception as e:
        return None, False, f"Gagal memuat YOLO: {str(e)}"

def format_rupiah(amount):
    return f"Rp {amount:,.0f}".replace(",", ".")

# 3. SIDEBAR PENGATURAN
with st.sidebar:
    st.title("⚙️ Pengaturan VisionPOS")
    model_file = st.text_input("Path File Model (.pt)", value="best.pt")
    conf_threshold = st.slider("Confidence Threshold", 0.25, 0.95, 0.50, 0.05)
    
    yolo_model, is_custom, model_status = load_yolo_model(model_file)
    if is_custom:
        st.success(model_status)
    else:
        st.info(model_status)

    if yolo_model and hasattr(yolo_model, "names"):
        st.write(f"Total: **{len(yolo_model.names)} kelas terdaftar**")
        if st.button("🔄 Sinkronkan Label ke Kasir"):
            for cls_name in yolo_model.names.values():
                if cls_name not in st.session_state.products:
                    st.session_state.products[cls_name] = {
                        "name": cls_name.replace("_", " ").title(),
                        "price": 10000,
                        "category": "Produk AI YOLO"
                    }
            st.success("Katalog kasir diperbarui!")
            st.rerun()

# 4. TAMPILAN UTAMA
st.title("🛒 VisionPOS - Kasir Otomatis AI YOLO")
col_camera, col_cart = st.columns([7, 5])

with col_camera:
    st.subheader("📹 Area Pindai Kamera")
    input_source = st.radio("Pilih Sumber:", ["Kamera Langsung (Webcam)", "Unggah Foto"], horizontal=True)
    
    image_to_process = None
    if input_source == "Kamera Langsung (Webcam)":
        cam_image = st.camera_input("Arahkan produk ke kamera")
        if cam_image:
            image_to_process = Image.open(cam_image)
    else:
        uploaded_file = st.file_uploader("Unggah foto produk di meja kasir", type=["jpg", "png", "jpeg"])
        if uploaded_file:
            image_to_process = Image.open(uploaded_file)

    detected_items = []
    if image_to_process and yolo_model:
        results = yolo_model.predict(source=image_to_process, conf=conf_threshold, verbose=False)
        img_boxes = image_to_process.copy()
        draw = ImageDraw.Draw(img_boxes)

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = yolo_model.names[cls_id]
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                
                detected_items.append({"class": cls_name, "confidence": conf})
                draw.rectangle(xyxy, outline="#10B981", width=4)
                
                prod_info = st.session_state.products.get(cls_name)
                label = f"{prod_info['name'] if prod_info else cls_name} ({int(conf*100)}%)"
                draw.rectangle([xyxy[0], max(0, xyxy[1]-20), xyxy[0]+len(label)*8, xyxy[1]], fill="#10B981")
                draw.text((xyxy[0]+2, max(0, xyxy[1]-18)), label, fill="#FFFFFF")

        st.image(img_boxes, caption=f"Hasil Deteksi ({len(detected_items)} objek)", use_container_width=True)
        if detected_items:
            if st.button("➕ Masukkan Semua ke Keranjang", type="primary"):
                for item in detected_items:
                    cls = item["class"]
                    st.session_state.cart[cls] = st.session_state.cart.get(cls, 0) + 1
                st.toast("Barang dimasukkan ke keranjang!", icon="🛒")
                st.rerun()

# 5. KERANJANG KASIR
with col_cart:
    st.subheader("🧾 Struk & Keranjang Kasir")
    if not st.session_state.cart:
        st.info("Keranjang kosong. Pindai barang untuk menambahkan.")
    else:
        subtotal = 0
        for cls, qty in list(st.session_state.cart.items()):
            prod = st.session_state.products.get(cls, {"name": cls, "price": 10000})
            item_total = prod["price"] * qty
            subtotal += item_total
            c1, c2, c3, c4 = st.columns([5, 2, 3, 1])
            c1.markdown(f"**{prod['name']}**")
            c2.markdown(f"x{qty}")
            c3.markdown(f"{format_rupiah(item_total)}")
            if c4.button("✕", key=f"d_{cls}"):
                del st.session_state.cart[cls]
                st.rerun()

        st.divider()
        tax_applied = st.checkbox("Kenakan PPN 11%", value=True)
        tax_amount = int(subtotal * 0.11) if tax_applied else 0
        total_bill = subtotal + tax_amount

        st.markdown(f"### Total Bayar: {format_rupiah(total_bill)}")
        pay_method = st.radio("Metode:", ["QRIS", "Tunai", "Debit"], horizontal=True)
        
        if st.button("💳 Selesaikan & Cetak Struk", type="primary", use_container_width=True):
            st.session_state.cart = {}
            st.balloons()
            st.success("Pembayaran Berhasil!")
            st.rerun()
`;

/**
 * requirements_streamlit.txt – Python dependencies (Streamlit + FastAPI)
 */
export const STREAMLIT_REQUIREMENTS_TXT = `# VisionPOS Python Dependencies
# Install: pip install -r requirements_streamlit.txt

streamlit>=1.35.0
ultralytics>=8.2.0
opencv-python-headless>=4.9.0.80
pillow>=10.3.0
pandas>=2.2.0
numpy>=1.26.0

# FastAPI REST backend (yolo_api.py)
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9
`;

/**
 * yolo_api.py – FastAPI REST backend (ditampilkan di YoloGuideView)
 * Endpoint: POST /detect  GET /classes  GET /health
 * Jalankan: uvicorn yolo_api:app --host 0.0.0.0 --port 8001 --reload
 */
export const YOLO_API_CODE = `# ==============================================================================
# VISIONPOS – YOLO FastAPI BACKEND  |  yolo_api.py
# Jembatan REST antara React frontend dan model YOLO .pt
#
# Install:  pip install fastapi uvicorn python-multipart ultralytics pillow
# Jalankan: uvicorn yolo_api:app --host 0.0.0.0 --port 8001 --reload
# ==============================================================================

import time, os, io
from typing import Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

app = FastAPI(title="VisionPOS YOLO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_yolo_model = None
_model_path: str = os.environ.get("YOLO_MODEL_PATH", "best.pt")
_model_loaded = False
_model_error: Optional[str] = None

def get_model():
    global _yolo_model, _model_loaded, _model_error
    if _model_loaded:
        return _yolo_model
    try:
        from ultralytics import YOLO
        if os.path.exists(_model_path):
            _yolo_model = YOLO(_model_path)
        else:
            _yolo_model = YOLO("yolov8n.pt")
            _model_error = f"'{_model_path}' tidak ditemukan, fallback ke yolov8n.pt"
        _model_loaded = True
    except Exception as exc:
        _model_error = str(exc)
    return _yolo_model

@app.get("/health")
async def health():
    m = get_model()
    return {"status": "ok" if m else "error", "model": _model_path,
            "classes_count": len(m.names) if m else 0, "warning": _model_error}

@app.get("/classes")
async def get_classes():
    m = get_model()
    if not m:
        raise HTTPException(503, detail=_model_error or "Model belum siap")
    return {"status": "ok", "classes": m.names, "count": len(m.names), "model": _model_path}

@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Form(default=0.5),
):
    m = get_model()
    if not m:
        raise HTTPException(503, detail=_model_error or "Model belum siap")
    raw = await file.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = img.size
    t0 = time.monotonic()
    results = m.predict(source=img, conf=float(confidence), verbose=False)
    latency = round((time.monotonic() - t0) * 1000)
    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "class": m.names[cls_id],
                "confidence": round(float(box.conf[0]), 4),
                "bbox": [round(y1/h,6), round(x1/w,6), round(y2/h,6), round(x2/w,6)],
            })
    return {"status": "ok", "count": len(detections),
            "latencyMs": latency, "modelVersion": _model_path, "detections": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("yolo_api:app", host="0.0.0.0", port=8001, reload=True)
`;
