import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Play,
  Pause,
  Upload,
  Layers,
  Sparkles,
  AlertCircle,
  Plus,
  SwitchCamera
} from 'lucide-react';
import { DetectedItem, Product, YoloConfig, BoundingBox } from '../types/pos';
import { DEMO_SAMPLES } from '../data/initialProducts';
import { detectObjects } from '../utils/yoloService';
import { formatRupiah } from '../utils/formatters';

interface CameraScannerProps {
  productsMap: Map<string, Product>;
  yoloConfig: YoloConfig;
  onAddToCart: (product: Product, method: 'yolo_auto' | 'yolo_manual', confidence?: number) => void;
  onAddMultipleToCart: (items: { product: Product; confidence: number }[]) => void;
  onOpenYoloSettings: () => void;
}

type VideoSource = 'camera' | 'demo_snacks' | 'demo_drinks' | 'upload';

export const CameraScanner: React.FC<CameraScannerProps> = ({
  productsMap,
  yoloConfig,
  onAddToCart,
  onAddMultipleToCart,
  onOpenYoloSettings,
}) => {
  const [source, setSource] = useState<VideoSource>('demo_snacks');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAutoScanActive, setIsAutoScanActive] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [detections, setDetections] = useState<DetectedItem[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanTimerRef = useRef<number | null>(null);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Handle source switch
  useEffect(() => {
    if (source === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [source, startCamera, stopCamera]);

  // Switch camera facing mode
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Get current active element (video or image)
  const getActiveElement = (): HTMLVideoElement | HTMLImageElement | null => {
    if (source === 'camera' && cameraActive && videoRef.current) {
      return videoRef.current;
    }
    if (source !== 'camera' && imageRef.current) {
      return imageRef.current;
    }
    return null;
  };

  // Execute single detection scan
  const executeScan = useCallback(async () => {
    const el = getActiveElement();
    if (!el || isScanning) return;

    setIsScanning(true);
    setApiError(null);

    // Get ground truth if on demo sample
    let demoDetections: { yoloClass: string; confidence: number; bbox: BoundingBox }[] | undefined;
    if (source === 'demo_snacks') {
      demoDetections = DEMO_SAMPLES[0].detections;
    } else if (source === 'demo_drinks') {
      demoDetections = DEMO_SAMPLES[1].detections;
    }

    const result = await detectObjects(el, yoloConfig, productsMap, demoDetections);

    setIsScanning(false);
    setLatencyMs(result.latencyMs);
    setLastScanTime(Date.now());

    if (result.error) {
      setApiError(result.error);
    } else {
      setDetections(result.detections);

      // Auto add to cart if configured
      if (yoloConfig.autoAddToCart && result.detections.length > 0) {
        const validToAdd: { product: Product; confidence: number }[] = [];
        result.detections.forEach((item) => {
          if (item.product && item.confidence >= yoloConfig.confidenceThreshold) {
            validToAdd.push({ product: item.product, confidence: item.confidence });
          }
        });
        if (validToAdd.length > 0) {
          onAddMultipleToCart(validToAdd);
        }
      }
    }
  }, [
    source,
    cameraActive,
    isScanning,
    yoloConfig,
    productsMap,
    onAddMultipleToCart,
  ]);

  // Auto-scan loop
  useEffect(() => {
    if (isAutoScanActive) {
      autoScanTimerRef.current = window.setInterval(() => {
        executeScan();
      }, yoloConfig.autoScanInterval);
    } else if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [isAutoScanActive, executeScan, yoloConfig.autoScanInterval]);

  // Run initial scan once demo image loads
  const handleImageLoad = () => {
    executeScan();
  };

  // Draw bounding boxes on canvas whenever detections change or window resizes
  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const el = getActiveElement();
    if (!canvas || !el) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = el.clientWidth;
    const displayHeight = el.clientHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length === 0) return;

    // Palette for different classes
    const colorPalette = [
      { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', text: '#065F46' }, // Emerald
      { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.15)', text: '#1E40AF' }, // Blue
      { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)', text: '#92400E' }, // Amber
      { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.15)', text: '#5B21B6' }, // Violet
      { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.15)', text: '#9D174D' }, // Pink
    ];

    detections.forEach((det, i) => {
      const palette = colorPalette[i % colorPalette.length];
      const x = det.bbox.xmin * displayWidth;
      const y = det.bbox.ymin * displayHeight;
      const w = (det.bbox.xmax - det.bbox.xmin) * displayWidth;
      const h = (det.bbox.ymax - det.bbox.ymin) * displayHeight;

      // Draw box fill
      ctx.fillStyle = palette.fill;
      ctx.fillRect(x, y, w, h);

      // Draw bounding box border with tech corner brackets
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.stroke;
      ctx.strokeRect(x, y, w, h);

      // Corner accent highlights
      const cornerLen = Math.min(16, w / 4, h / 4);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = palette.stroke;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLen);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLen, y + h);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // Draw Label Badge
      const labelName = det.product ? det.product.name : det.yoloClass;
      const confText = `${Math.round(det.confidence * 100)}%`;
      const priceText = det.product ? ` · ${formatRupiah(det.product.price)}` : '';
      const fullLabel = `${labelName} (${confText})${priceText}`;

      ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
      const textMetrics = ctx.measureText(fullLabel);
      const textWidth = textMetrics.width;
      const badgeHeight = 22;
      const badgeY = Math.max(0, y - badgeHeight);

      // Label background
      ctx.fillStyle = palette.stroke;
      ctx.fillRect(x, badgeY, textWidth + 14, badgeHeight);

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(fullLabel, x + 7, badgeY + 15);
    });
  }, [detections, source, cameraActive]);

  useEffect(() => {
    drawBoundingBoxes();
    const handleResize = () => drawBoundingBoxes();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawBoundingBoxes]);

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImageUrl(url);
      setSource('upload');
      setDetections([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Source Switcher & Mode Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSource('demo_snacks')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              source === 'demo_snacks'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Demo 1: Snacks
          </button>

          <button
            type="button"
            onClick={() => setSource('demo_drinks')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              source === 'demo_drinks'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Demo 2: Minuman
          </button>

          <button
            type="button"
            onClick={() => setSource('camera')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              source === 'camera'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              source === 'upload'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Inference Status Information */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {source === 'camera' && cameraActive && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="cursor-pointer text-slate-600 hover:text-slate-900 flex items-center gap-1"
              title="Ganti Kamera Depan/Belakang"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span>Ganti Kamera</span>
            </button>
          )}

          <span>Latency: <strong className="font-mono tabular-nums text-slate-700">{latencyMs}ms</strong></span>
          <span aria-hidden="true">·</span>
          <span>Ditemukan: <strong className="font-mono tabular-nums text-emerald-600">{detections.length} objek</strong></span>
        </div>
      </div>

      {/* Main Vision Viewport */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-sm aspect-4/3 flex items-center justify-center">
        {/* Source: Camera Video */}
        {source === 'camera' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {cameraError ? (
              <div className="text-center p-6 max-w-md">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-white text-sm font-medium mb-1">Akses Kamera Terkendala</p>
                <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="cursor-pointer px-4 py-2 bg-white text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Coba Akses Ulang
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={drawBoundingBoxes}
              />
            )}
          </div>
        )}

        {/* Source: Demo Snacks Tray */}
        {source === 'demo_snacks' && (
          <img
            ref={imageRef}
            src={DEMO_SAMPLES[0].imageUrl}
            alt="Demo Meja Kasir Makanan Ringan"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            className="w-full h-full object-cover"
          />
        )}

        {/* Source: Demo Drinks Tray */}
        {source === 'demo_drinks' && (
          <img
            ref={imageRef}
            src={DEMO_SAMPLES[1].imageUrl}
            alt="Demo Meja Kasir Minuman"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            className="w-full h-full object-cover"
          />
        )}

        {/* Source: Uploaded Custom Image */}
        {source === 'upload' && uploadedImageUrl && (
          <img
            ref={imageRef}
            src={uploadedImageUrl}
            alt="Foto Produk Diunggah"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            className="w-full h-full object-contain"
          />
        )}

        {/* Canvas overlay for drawing real-time bounding boxes */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none w-full h-full"
        />

        {/* Scanning sweep animation overlay when scan is actively in progress */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse border-y-2 border-emerald-400" />
        )}

        {/* Viewport Floating HUD Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-white text-xs">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">
            {source === 'camera'
              ? 'Webcam Feed'
              : source === 'demo_snacks'
              ? 'Demo: Snacks Tray'
              : source === 'demo_drinks'
              ? 'Demo: Drinks Tray'
              : 'Foto Upload'}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {yoloConfig.mode === 'simulated' ? 'Simulasi' : 'YOLO API'}
          </span>
        </div>
      </div>

      {/* Error Banner if API error occurred */}
      {apiError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={onOpenYoloSettings}
            className="underline font-semibold text-rose-900 ml-3 shrink-0"
          >
            Buka Pengaturan
          </button>
        </div>
      )}

      {/* Bottom Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={executeScan}
            disabled={isScanning}
            className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Pindai Frame Sekarang</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoScanActive(!isAutoScanActive)}
            className={`cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              isAutoScanActive
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAutoScanActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoScanActive ? 'Auto-Scan Aktif' : 'Nyalakan Auto-Scan'}</span>
          </button>
        </div>

        {/* Quick Batch Add Button */}
        {detections.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const itemsToAdd: { product: Product; confidence: number }[] = [];
              detections.forEach((d) => {
                if (d.product) {
                  itemsToAdd.push({ product: d.product, confidence: d.confidence });
                }
              });
              if (itemsToAdd.length > 0) {
                onAddMultipleToCart(itemsToAdd);
              }
            }}
            className="cursor-pointer px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masukkan Semua ke Keranjang ({detections.length})</span>
          </button>
        )}
      </div>

      {/* Detected Items Strip */}
      {detections.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Objek Dikenali di Area Kamera ({detections.length})
            </h4>
            <span className="text-xs text-slate-500">
              Klik tanda (+) untuk memasukkan item satu per satu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {detections.map((det) => {
              const product = det.product;
              return (
                <div
                  key={det.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {product ? product.name : det.yoloClass}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-emerald-600 font-semibold">
                        {Math.round(det.confidence * 100)}%
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {product ? formatRupiah(product.price) : 'Belum di katalog'}
                      </span>
                    </div>
                  </div>

                  {product && (
                    <button
                      type="button"
                      onClick={() => onAddToCart(product, 'yolo_manual', det.confidence)}
                      className="cursor-pointer w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors shrink-0"
                      title="Tambahkan 1 ke keranjang"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
