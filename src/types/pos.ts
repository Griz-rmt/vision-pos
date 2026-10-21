export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  barcode: string;
  yoloClass: string;
  imageUrl?: string;
  description?: string;
}

export interface BoundingBox {
  ymin: number; // 0 to 1
  xmin: number; // 0 to 1
  ymax: number; // 0 to 1
  xmax: number; // 0 to 1
}

export interface DetectedItem {
  id: string;
  yoloClass: string;
  confidence: number; // 0 to 1
  bbox: BoundingBox;
  product?: Product;
  timestamp: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedMethod: 'yolo_auto' | 'yolo_manual' | 'barcode' | 'manual';
  detectedConfidence?: number;
}

export type PaymentMethod = 'qris' | 'cash' | 'card' | 'ewallet';

export interface Transaction {
  id: string;
  transactionNumber: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  cashierName: string;
}

export interface YoloConfig {
  mode: 'simulated' | 'http_api';
  apiUrl: string;
  confidenceThreshold: number; // e.g. 0.50
  autoAddToCart: boolean;
  autoScanInterval: number; // ms, e.g. 1000
  cooldownSeconds: number; // prevent immediate re-add of same item
}
