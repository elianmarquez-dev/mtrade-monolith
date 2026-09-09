import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck, ShieldAlert } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    shippingFee,
    tax,
    total,
    openCheckout
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 100;
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-900" />
              <h2 className="text-base font-bold text-stone-900">Carrito de Compras</h2>
              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs">
              {amountForFreeShipping > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-stone-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      Agrega <strong className="text-stone-900">${amountForFreeShipping.toFixed(2)}</strong> para Envío Gratis
                    </span>
                    <span className="text-stone-500">{freeShippingPercent}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${freeShippingPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <Truck className="w-4 h-4" />
                  <span>¡Felicidades! Calificas para Envío Gratis a domicilio</span>
                </div>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800">Tu carrito está vacío</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Explora nuestro catálogo con productos de alta tecnología y añade lo que te guste.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Continuar Comprando
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {product.title}
                        </h4>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-stone-400 hover:text-rose-600 transition p-0.5"
                          title="Eliminar artículo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        SKU: {product.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity buttons */}
                      <div className="flex items-center border border-stone-300 rounded-md overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2 py-0.5 bg-stone-50 hover:bg-stone-100 text-stone-700"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 font-semibold text-stone-900 min-w-[24px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="px-2 py-0.5 bg-stone-50 hover:bg-stone-100 text-stone-700 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total */}
                      <span className="text-xs font-bold text-stone-900">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Totals */}
          {items.length > 0 && (
            <div className="p-5 bg-stone-50 border-t border-stone-200">
              <div className="space-y-1.5 text-xs text-stone-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío estimado</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-600 font-bold">GRATIS</strong>
                    ) : (
                      `$${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos (21% IVA)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Final</span>
                  <span className="text-base text-emerald-800">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={openCheckout}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>Proceder al Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-stone-500 mt-2">
                Conexión segura coordinada por Orders & Payments Services
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
