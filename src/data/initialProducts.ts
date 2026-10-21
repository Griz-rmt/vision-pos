import { Product, BoundingBox } from '../types/pos';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_indomie_goreng',
    name: 'Indomie Mi Goreng Original 85g',
    category: 'Makanan Instan',
    price: 3500,
    barcode: '8998866200234',
    yoloClass: 'indomie_goreng',
    description: 'Mi instan goreng legendaris dengan bumbu rempah pilihan'
  },
  {
    id: 'prod_oreo_box',
    name: 'Oreo Original Vanilla Box 123g',
    category: 'Biskuit & Snack',
    price: 11500,
    barcode: '7622210741290',
    yoloClass: 'oreo_box',
    description: 'Biskuit cokelat lapis krim vanila gurih renyah'
  },
  {
    id: 'prod_cadbury_fingers',
    name: 'Cadbury Dairy Milk Fingers 114g',
    category: 'Cokelat & Manisan',
    price: 24000,
    barcode: '5000168012345',
    yoloClass: 'cadbury_fingers',
    description: 'Biskuit renyah berbalut cokelat susu lembut khas Cadbury'
  },
  {
    id: 'prod_cup_noodles',
    name: 'Nissin Cup Noodles Seafood 75g',
    category: 'Makanan Instan',
    price: 14500,
    barcode: '8888012345678',
    yoloClass: 'cup_noodles',
    description: 'Mi instan cup dengan topping sayur dan seafood lezat'
  },
  {
    id: 'prod_maggi_noodles',
    name: 'Maggi Chicken Noodles 2-Minute 77g',
    category: 'Makanan Instan',
    price: 6000,
    barcode: '8901058852899',
    yoloClass: 'maggi_noodles',
    description: 'Mi instan kuah kaldu ayam lezat'
  },
  {
    id: 'prod_loacker_wafer',
    name: 'Loacker Quadratini Wafer 125g',
    category: 'Biskuit & Snack',
    price: 32000,
    barcode: '8000380005702',
    yoloClass: 'loacker_wafer',
    description: 'Wafer kubus renyah khas Italia dengan krim cokelat premium'
  },
  {
    id: 'prod_choco_leibniz',
    name: 'Bahlsen Choco Leibniz Milk 125g',
    category: 'Biskuit & Snack',
    price: 28500,
    barcode: '4017100378008',
    yoloClass: 'choco_leibniz',
    description: 'Biskuit mentega dengan lempengan cokelat susu tebal'
  },
  {
    id: 'prod_tortilla_wraps',
    name: 'Old El Paso Tortilla Wraps 8s',
    category: 'Bahan Roti & Wrap',
    price: 38000,
    barcode: '046000288881',
    yoloClass: 'tortilla_wraps',
    description: 'Tortilla gandum lembut siap santap untuk taco & burrito'
  },
  {
    id: 'prod_coca_cola',
    name: 'Coca-Cola Kaleng 330ml',
    category: 'Minuman Dingin',
    price: 8000,
    barcode: '8886008101053',
    yoloClass: 'coca_cola',
    description: 'Minuman berkarbonasi rasa kola yang menyegarkan'
  },
  {
    id: 'prod_sanpellegrino_can',
    name: 'Sanpellegrino Aranciata Kaleng 330ml',
    category: 'Minuman Dingin',
    price: 22000,
    barcode: '8002270014234',
    yoloClass: 'sanpellegrino_can',
    description: 'Minuman sari buah jeruk Italia berkarbonasi alami'
  },
  {
    id: 'prod_nestea_lemon',
    name: 'Nestea Lemon Iced Tea Botol 500ml',
    category: 'Minuman Teh',
    price: 7500,
    barcode: '8992761002345',
    yoloClass: 'nestea_lemon',
    description: 'Teh rasa lemon segar penyejuk dahaga'
  },
  {
    id: 'prod_evian_water',
    name: 'Evian Natural Mineral Water 500ml',
    category: 'Air Mineral',
    price: 18500,
    barcode: '3068320114086',
    yoloClass: 'evian_water',
    description: 'Air mineral alami pegunungan Alpen Perancis'
  },
  {
    id: 'prod_green_tea',
    name: 'Ito En Oi Ocha Green Tea 500ml',
    category: 'Minuman Teh',
    price: 14000,
    barcode: '4901085089347',
    yoloClass: 'green_tea',
    description: 'Teh hijau tanpa gula autentik khas Jepang'
  },
  {
    id: 'prod_sparkling_water',
    name: 'S.Pellegrino Sparkling Water 500ml',
    category: 'Air Mineral',
    price: 25000,
    barcode: '8002270018553',
    yoloClass: 'sparkling_water',
    description: 'Air mineral berkarbonasi alami dari sumber San Pellegrino Terme'
  }
];

export interface DemoSample {
  id: string;
  title: string;
  imageUrl: string;
  detections: {
    yoloClass: string;
    confidence: number;
    bbox: BoundingBox;
  }[];
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'tray_snacks',
    title: 'Demo 1: Meja Kasir Makanan Ringan (Snacks & Mi)',
    imageUrl: '/src/assets/images/checkout_tray_snacks_1792553777588.jpg',
    detections: [
      {
        yoloClass: 'oreo_box',
        confidence: 0.96,
        bbox: { ymin: 0.28, xmin: 0.23, ymax: 0.62, xmax: 0.36 }
      },
      {
        yoloClass: 'cadbury_fingers',
        confidence: 0.94,
        bbox: { ymin: 0.31, xmin: 0.37, ymax: 0.61, xmax: 0.48 }
      },
      {
        yoloClass: 'indomie_goreng',
        confidence: 0.93,
        bbox: { ymin: 0.23, xmin: 0.50, ymax: 0.39, xmax: 0.67 }
      },
      {
        yoloClass: 'indomie_goreng',
        confidence: 0.91,
        bbox: { ymin: 0.39, xmin: 0.50, ymax: 0.55, xmax: 0.67 }
      },
      {
        yoloClass: 'cup_noodles',
        confidence: 0.95,
        bbox: { ymin: 0.25, xmin: 0.68, ymax: 0.45, xmax: 0.81 }
      },
      {
        yoloClass: 'maggi_noodles',
        confidence: 0.89,
        bbox: { ymin: 0.29, xmin: 0.80, ymax: 0.51, xmax: 0.92 }
      },
      {
        yoloClass: 'loacker_wafer',
        confidence: 0.97,
        bbox: { ymin: 0.55, xmin: 0.51, ymax: 0.83, xmax: 0.65 }
      },
      {
        yoloClass: 'choco_leibniz',
        confidence: 0.94,
        bbox: { ymin: 0.49, xmin: 0.67, ymax: 0.83, xmax: 0.78 }
      },
      {
        yoloClass: 'tortilla_wraps',
        confidence: 0.88,
        bbox: { ymin: 0.62, xmin: 0.34, ymax: 0.85, xmax: 0.50 }
      }
    ]
  },
  {
    id: 'tray_drinks',
    title: 'Demo 2: Meja Kasir Aneka Minuman (Drinks)',
    imageUrl: '/src/assets/images/checkout_tray_drinks_1792553776467.jpg',
    detections: [
      {
        yoloClass: 'sparkling_water',
        confidence: 0.97,
        bbox: { ymin: 0.36, xmin: 0.22, ymax: 0.71, xmax: 0.31 }
      },
      {
        yoloClass: 'coca_cola',
        confidence: 0.98,
        bbox: { ymin: 0.48, xmin: 0.30, ymax: 0.68, xmax: 0.38 }
      },
      {
        yoloClass: 'sanpellegrino_can',
        confidence: 0.95,
        bbox: { ymin: 0.48, xmin: 0.38, ymax: 0.68, xmax: 0.46 }
      },
      {
        yoloClass: 'nestea_lemon',
        confidence: 0.93,
        bbox: { ymin: 0.39, xmin: 0.52, ymax: 0.70, xmax: 0.60 }
      },
      {
        yoloClass: 'evian_water',
        confidence: 0.96,
        bbox: { ymin: 0.37, xmin: 0.59, ymax: 0.71, xmax: 0.68 }
      },
      {
        yoloClass: 'green_tea',
        confidence: 0.94,
        bbox: { ymin: 0.39, xmin: 0.66, ymax: 0.71, xmax: 0.75 }
      }
    ]
  }
];
