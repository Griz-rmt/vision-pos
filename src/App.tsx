import React, { useState, useMemo } from 'react';
import { Product, CartItem, YoloConfig, Transaction } from './types/pos';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { CartPanel } from './components/CartPanel';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { YoloConfigModal } from './components/YoloConfigModal';
import { ProductCatalogView } from './components/ProductCatalogView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { YoloGuideView } from './components/YoloGuideView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'catalog' | 'history' | 'guide'>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [includeTax, setIncludeTax] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Completed transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isYoloConfigOpen, setIsYoloConfigOpen] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // YOLO Configuration
  const [yoloConfig, setYoloConfig] = useState<YoloConfig>({
    mode: 'simulated',
    apiUrl: 'http://localhost:8001/detect',
    confidenceThreshold: 0.5,
    autoAddToCart: true,
    autoScanInterval: 1200,
    cooldownSeconds: 2,
  });

  // Fast lookup Map for YOLO classes -> Product
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.yoloClass, p));
    return map;
  }, [products]);

  // Cart Management
  const handleAddToCart = (
    product: Product,
    method: 'yolo_auto' | 'yolo_manual' | 'barcode' | 'manual',
    confidence?: number
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          detectedConfidence: confidence || updated[existingIndex].detectedConfidence,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            addedMethod: method,
            detectedConfidence: confidence,
          },
        ];
      }
    });
  };

  const handleAddMultipleToCart = (itemsToAdd: { product: Product; confidence: number }[]) => {
    setCart((prev) => {
      const updated = [...prev];
      itemsToAdd.forEach(({ product, confidence }) => {
        const existingIndex = updated.findIndex((item) => item.product.id === product.id);
        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
            detectedConfidence: confidence,
          };
        } else {
          updated.push({
            product,
            quantity: 1,
            addedMethod: 'yolo_auto',
            detectedConfidence: confidence,
          });
        }
      });
      return updated;
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Calculations for current cart
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = includeTax ? Math.round(subtotal * 0.11) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Payment completion
  const handlePaymentSuccess = (newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
    setIsPaymentOpen(false);
    setActiveReceipt(newTransaction);
    setCart([]);
    setDiscountAmount(0);
  };

  // Product Catalog CRUD
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleResetProducts = () => {
    setProducts(INITIAL_PRODUCTS);
  };

  // Auto import classes from model .pt
  const handleImportClassesToCatalog = (modelClasses: string[]) => {
    setProducts((prev) => {
      const existingClasses = new Set(prev.map((p) => p.yoloClass));
      const newItems: Product[] = [];

      modelClasses.forEach((cls) => {
        if (!existingClasses.has(cls)) {
          // Format clean readable name from snake_case (e.g. indomie_goreng -> Indomie Goreng)
          const formattedName = cls
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          newItems.push({
            id: `prod_hf_${cls}_${Date.now()}`,
            name: formattedName,
            category: 'Produk Model .pt',
            price: 10000,
            barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            yoloClass: cls,
            description: 'Diimpor otomatis dari model .pt Hugging Face',
          });
        }
      });

      return [...newItems, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        yoloConfig={yoloConfig}
        onOpenYoloSettings={() => setIsYoloConfigOpen(true)}
        cartItemCount={totalItemCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Computer Vision Live Scanner Viewport */}
            <div className="lg:col-span-7 xl:col-span-8">
              <CameraScanner
                productsMap={productsMap}
                yoloConfig={yoloConfig}
                onAddToCart={handleAddToCart}
                onAddMultipleToCart={handleAddMultipleToCart}
                onOpenYoloSettings={() => setIsYoloConfigOpen(true)}
              />
            </div>

            {/* Right Column: Checkout Cart & Bill Summary */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              <CartPanel
                items={cart}
                allProducts={products}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onAddToCart={(prod) => handleAddToCart(prod, 'manual')}
                onProceedToPayment={() => setIsPaymentOpen(true)}
                includeTax={includeTax}
                setIncludeTax={setIncludeTax}
                discountAmount={discountAmount}
                setDiscountAmount={setDiscountAmount}
              />
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <ProductCatalogView
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetProducts={handleResetProducts}
            onAddToCartDirect={(prod) => {
              handleAddToCart(prod, 'manual');
              setActiveTab('pos');
            }}
            onOpenYoloSettings={() => setIsYoloConfigOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={transactions}
            onSelectTransaction={(trx) => setActiveReceipt(trx)}
            onNewTransaction={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'guide' && (
          <YoloGuideView
            onGoToPos={() => setActiveTab('pos')}
            onOpenSettings={() => setIsYoloConfigOpen(true)}
          />
        )}
      </main>

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cart}
        subtotal={subtotal}
        tax={tax}
        discount={discountAmount}
        total={total}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onNewTransaction={() => {
          setActiveReceipt(null);
          setActiveTab('pos');
        }}
      />

      {/* YOLO Configuration Modal */}
      <YoloConfigModal
        isOpen={isYoloConfigOpen}
        onClose={() => setIsYoloConfigOpen(false)}
        config={yoloConfig}
        onSaveConfig={(newConfig) => setYoloConfig(newConfig)}
        onImportClassesToCatalog={handleImportClassesToCatalog}
      />
    </div>
  );
}
