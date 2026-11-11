import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersModal } from './components/OrdersModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { AddProductModal } from './components/AddProductModal';
import { Product } from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const MainLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productRefreshSignal, setProductRefreshSignal] = useState(0);
  const { t } = useLanguage();

  const refreshProducts = () => setProductRefreshSignal((current) => current + 1);

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddProduct={() => setIsAddProductOpen(true)}
      />

      <section className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {t('Explora nuestros productos')}
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            {t('Encuentra lo que necesitas y recíbelo en casa.')}
          </p>
        </div>
      </section>

      <main className="flex-1">
        <ProductGrid
          searchQuery={searchQuery}
          refreshSignal={productRefreshSignal}
          onQuickView={setSelectedProduct}
          onProductDeleted={refreshProducts}
        />
      </main>

      <footer className="bg-white border-t border-stone-200 py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-stone-900">MTrade</span>
          <span>{t('© 2026 MTrade. Todos los derechos reservados.')}</span>
        </div>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onReviewSubmitted={refreshProducts}
      />
      <CartDrawer />
      <CheckoutModal />
      <OrdersModal />
      <UserProfileModal />
      <AuthModal />
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onCreated={refreshProducts}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
