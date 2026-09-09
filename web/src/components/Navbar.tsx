import React, { useState } from 'react';
import { ShoppingBag, Search, User, Package, Layers, ShieldCheck, LogOut, ChevronDown, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMonolith } from '../context/MonolithContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery, onSearchChange }) => {
  const { session, logout, openAuthModal, openProfileModal } = useAuth();
  const { totalItemsCount, openCart, openOrdersModal } = useCart();
  const { toggleInspector, logs } = useMonolith();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top micro-banner for Backend Monolith Architecture indication */}
      <div className="bg-stone-900 text-stone-200 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 text-stone-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Monolito Modular Backend: 5 Servicios (auth • users • products • orders • payments)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleInspector}
              className="inline-flex items-center gap-1.5 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-2.5 py-0.5 rounded text-xs transition cursor-pointer"
              title="Abrir Inspector de Servicios Monolito"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspector de API ({logs.length} reqs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                M
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-lg text-stone-900 tracking-tight block">
                  MODULAR<span className="text-emerald-600">.STORE</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide block uppercase">
                  Modular Monolith Platform
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar productos por nombre, categoría o SKU..."
                className="w-full bg-stone-100 text-stone-900 text-sm rounded-lg pl-10 pr-9 py-2 border border-transparent focus:border-stone-400 focus:bg-white focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions & Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Orders Button */}
            <button
              onClick={openOrdersModal}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
              title="Ver mis pedidos creados en Orders Service"
            >
              <Package className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Mis Pedidos</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg text-sm font-medium transition cursor-pointer"
              title="Abrir Carrito"
            >
              <ShoppingBag className="w-4 h-4 text-stone-800" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItemsCount > 0 && (
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Dropdown */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 text-sm font-medium text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition"
                >
                  {session.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt={session.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <User className="w-4 h-4 text-stone-600" />
                  )}
                  <span className="hidden sm:inline max-w-[110px] truncate text-xs font-semibold">
                    {session.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 text-sm divide-y divide-stone-100">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-stone-900 truncate">{session.name}</p>
                      <p className="text-xs text-stone-500 truncate">{session.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wide">
                          Rol: {session.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openProfileModal();
                        }}
                        className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-stone-400" />
                        <span>Mi Perfil y Direcciones</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openOrdersModal();
                        }}
                        className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-stone-400" />
                        <span>Historial de Pedidos</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          toggleInspector();
                        }}
                        className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Layers className="w-4 h-4 text-emerald-500" />
                        <span>Monolito API Inspector</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión (Auth Service)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        {isMobileSearchOpen && (
          <div className="pb-3 md:hidden">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full bg-stone-100 text-stone-900 text-sm rounded-lg pl-10 pr-9 py-2 border border-transparent focus:border-stone-400 focus:bg-white focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
