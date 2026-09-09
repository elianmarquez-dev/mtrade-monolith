import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  CreditCard,
  Users,
  Box,
  Layers,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Lock
} from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MonolithProvider, useMonolith } from './context/MonolithContext';
import { Navbar } from './components/Navbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersModal } from './components/OrdersModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { MonolithInspector } from './components/MonolithInspector';
import { Product, ServiceName } from './types';

const MainLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { openInspector, setSelectedServiceFilter, logs } = useMonolith();

  const handleOpenService = (service: ServiceName) => {
    setSelectedServiceFilter(service);
    openInspector();
  };

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar with Monolith Status */}
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Hero & Monolith Modular Architecture Overview Banner */}
      <section className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Arquitectura Monolito Modular • 5 Servicios de Dominio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Plataforma E-Commerce Modular
              </h1>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Interfaz desacoplada en React y Tailwind CSS conectada a los servicios independientes de <strong>auth</strong>, <strong>users</strong>, <strong>products</strong>, <strong>orders</strong> y <strong>payments</strong>.
              </p>
            </div>

            {/* 5 Modular Services Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => handleOpenService('auth')}
                className="group flex items-center gap-2 bg-stone-50 hover:bg-purple-50 hover:border-purple-300 border border-stone-200 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Ver detalles del módulo Auth"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-stone-900 block leading-none">auth</span>
                  <span className="text-[10px] text-stone-500 font-medium">JWT & Sesión</span>
                </div>
              </button>

              <button
                onClick={() => handleOpenService('users')}
                className="group flex items-center gap-2 bg-stone-50 hover:bg-blue-50 hover:border-blue-300 border border-stone-200 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Ver detalles del módulo Users"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-stone-900 block leading-none">users</span>
                  <span className="text-[10px] text-stone-500 font-medium">Perfiles & Direcciones</span>
                </div>
              </button>

              <button
                onClick={() => handleOpenService('products')}
                className="group flex items-center gap-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Ver detalles del módulo Products"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Box className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-stone-900 block leading-none">products</span>
                  <span className="text-[10px] text-stone-500 font-medium">Stock & Catálogo</span>
                </div>
              </button>

              <button
                onClick={() => handleOpenService('orders')}
                className="group flex items-center gap-2 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Ver detalles del módulo Orders"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-stone-900 block leading-none">orders</span>
                  <span className="text-[10px] text-stone-500 font-medium">Carrito & Estados</span>
                </div>
              </button>

              <button
                onClick={() => handleOpenService('payments')}
                className="group flex items-center gap-2 bg-stone-50 hover:bg-rose-50 hover:border-rose-300 border border-stone-200 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                title="Ver detalles del módulo Payments"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-stone-900 block leading-none">payments</span>
                  <span className="text-[10px] text-stone-500 font-medium">Cobros & Pasarelas</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Products Catalog Content */}
      <main className="flex-1">
        <ProductGrid
          searchQuery={searchQuery}
          onQuickView={(prod) => setSelectedProduct(prod)}
        />
      </main>

      {/* Floating Monolith Telemetry Inspector Trigger */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={openInspector}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full shadow-lg border border-stone-700 hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer text-xs font-bold"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Monolito API Inspector</span>
          <span className="bg-stone-800 text-stone-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {logs.length} reqs
          </span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-10 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2">
              <span className="font-black text-stone-900 text-sm tracking-tight block">
                MODULAR<span className="text-emerald-600">.STORE</span>
              </span>
              <p className="leading-relaxed">
                Plataforma de comercio electrónico basada en arquitectura de monolito modular con 5 servicios integrados: Auth, Users, Products, Orders y Payments.
              </p>
            </div>

            <div>
              <span className="font-bold text-stone-900 block mb-2">Servicios del Monolito</span>
              <ul className="space-y-1">
                <li>• Auth Service (RFC 7519 JWT)</li>
                <li>• Users Service (Gestión de perfiles)</li>
                <li>• Products Service (Catálogo e inventario)</li>
                <li>• Orders Service (Máquina de estados de pedidos)</li>
                <li>• Payments Service (Pasarelas y cobros)</li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-stone-900 block mb-2">Pila Tecnológica Frontend</span>
              <ul className="space-y-1">
                <li>• React 19 con TypeScript</li>
                <li>• Tailwind CSS moderno</li>
                <li>• Lucide Icons para simbología técnica</li>
                <li>• Inspector de telemetría HTTP en tiempo real</li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-stone-900 block mb-2">Garantía & Seguridad</span>
              <p className="leading-relaxed">
                Manejo transaccional atómico con reserva de inventario previa a la confirmación de pago y emisión de comprobantes digitales.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Modular E-Commerce Platform. Diseñado con React y Tailwind CSS.</p>
            <div className="flex items-center gap-4 text-stone-600 font-medium">
              <span>5 Servicios Activos</span>
              <span>•</span>
              <span>100% Sin Errores</span>
              <span>•</span>
              <button onClick={openInspector} className="text-emerald-700 hover:underline">
                Abrir Inspector
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
      <CartDrawer />
      <CheckoutModal />
      <OrdersModal />
      <UserProfileModal />
      <AuthModal />
      <MonolithInspector />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MonolithProvider>
          <MainLayout />
        </MonolithProvider>
      </CartProvider>
    </AuthProvider>
  );
}
