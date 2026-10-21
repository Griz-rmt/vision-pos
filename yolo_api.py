# ==============================================================================
# VISIONPOS – YOLO FastAPI BACKEND
# Jembatan REST antara React frontend dan model YOLO .pt
#
# Install:  pip install fastapi uvicorn python-multipart ultralytics pillow
# Jalankan: uvicorn yolo_api:app --host 0.0.0.0 --port 8001 --reload
#
# Endpoint:
#   GET  /           → health check (HTML/JSON)
#   GET  /health     → { status, model, classes_count }
#   GET  /classes    → { status, classes, count, model }
#   POST /detect     → multipart file=<image>, confidence=<float>
#                      → { detections, count, latencyMs, modelVersion }
# ==============================================================================

import time
import os
import io
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# ── App Instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="VisionPOS YOLO API",
    description="REST endpoint untuk inferensi model YOLO .pt hasil Google Colab",
    version="1.0.0",
)

# ── CORS (izinkan React dev server & Streamlit Cloud) ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Untuk produksi, ganti dengan domain spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Muat Model YOLO Sekali (lazy, cached) ─────────────────────────────────────
_yolo_model = None
_model_path: str = os.environ.get("YOLO_MODEL_PATH", "best.pt")
_model_loaded: bool = False
_model_error: Optional[str] = None


def get_model():
    """Muat model YOLO dari disk (lazy singleton, aman untuk multi-request)."""
    global _yolo_model, _model_loaded, _model_error

    if _model_loaded:
        return _yolo_model

    try:
        from ultralytics import YOLO  # type: ignore

        if os.path.exists(_model_path):
            _yolo_model = YOLO(_model_path)
            print(f"[VisionPOS API] ✅ Model '{_model_path}' berhasil dimuat. "
                  f"Kelas: {len(_yolo_model.names)}")
        else:
            # Fallback: gunakan YOLOv8n bawaan jika best.pt belum ada
            _yolo_model = YOLO("yolov8n.pt")
            _model_error = (
                f"⚠️  '{_model_path}' tidak ditemukan. "
                "Menggunakan fallback 'yolov8n.pt'. "
                "Letakkan best.pt di folder yang sama dengan yolo_api.py."
            )
            print(f"[VisionPOS API] {_model_error}")

        _model_loaded = True

    except ImportError:
        _model_error = "ultralytics tidak terinstall. Jalankan: pip install ultralytics"
        print(f"[VisionPOS API] ❌ {_model_error}")

    except Exception as exc:
        _model_error = str(exc)
        print(f"[VisionPOS API] ❌ Gagal memuat model: {_model_error}")

    return _yolo_model


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health():
    model = get_model()
    if model is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "model": _model_path,
                "error": _model_error or "Model gagal dimuat",
                "classes_count": 0,
            },
        )

    return {
        "status": "ok",
        "model": _model_path,
        "classes_count": len(model.names),
        "warning": _model_error,
    }


# ── GET /classes ───────────────────────────────────────────────────────────────
@app.get("/classes", tags=["Model"])
async def get_classes():
    """
    Kembalikan semua label/kelas yang ada di model .pt.
    Format: { status, classes: {0: "indomie_goreng", ...}, count, model }
    """
    model = get_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=_model_error or "Model YOLO belum siap.",
        )

    return {
        "status": "ok",
        "classes": model.names,           # dict {id: class_name}
        "count": len(model.names),
        "model": _model_path,
        "warning": _model_error,
    }


# ── POST /detect ───────────────────────────────────────────────────────────────
@app.post("/detect", tags=["Inference"])
async def detect(
    file: UploadFile = File(..., description="Gambar dalam format JPEG/PNG"),
    confidence: float = Form(default=0.5, description="Ambang batas confidence (0.0–1.0)"),
):
    """
    Terima gambar → jalankan YOLO → kembalikan list deteksi.

    Response:
    ```json
    {
      "status": "ok",
      "count": 3,
      "latencyMs": 87,
      "modelVersion": "best.pt",
      "detections": [
        {
          "class": "indomie_goreng",
          "confidence": 0.94,
          "bbox": [ymin_norm, xmin_norm, ymax_norm, xmax_norm]
        }
      ]
    }
    ```
    bbox dinormalisasi 0–1 relatif terhadap ukuran gambar.
    """
    model = get_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=_model_error or "Model YOLO belum siap.",
        )

    # Validasi tipe file
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/bmp"):
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG atau PNG.",
        )

    # Baca gambar dari multipart
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img_w, img_h = img.size
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal membaca gambar: {exc}")

    # Jalankan inferensi YOLO
    t0 = time.monotonic()
    try:
        results = model.predict(
            source=img,
            conf=float(confidence),
            verbose=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inferensi gagal: {exc}")
    latency_ms = round((time.monotonic() - t0) * 1000)

    # Parse deteksi → normalisasi bbox ke 0–1
    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id]
            conf_val = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append(
                {
                    "class": cls_name,
                    "confidence": round(conf_val, 4),
                    # Format: [ymin, xmin, ymax, xmax] ternormalisasi 0–1
                    # Ini konsisten dengan format yang dibaca oleh yoloService.ts
                    "bbox": [
                        round(y1 / img_h, 6),
                        round(x1 / img_w, 6),
                        round(y2 / img_h, 6),
                        round(x2 / img_w, 6),
                    ],
                }
            )

    return {
        "status": "ok",
        "count": len(detections),
        "latencyMs": latency_ms,
        "modelVersion": _model_path,
        "detections": detections,
    }


# ── Entry Point (jalankan langsung: python yolo_api.py) ───────────────────────
if __name__ == "__main__":
    import uvicorn  # type: ignore

    uvicorn.run(
        "yolo_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
