import React, { useState } from 'react';
import { Star, ShoppingBag, Eye, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 8;

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative bg-white rounded-xl border border-stone-200 hover:border-stone-400/80 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-stone-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm tracking-wide uppercase">
              Destacado
            </span>
          )}
        </div>

        {/* Quick View Hover Action */}
        <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="bg-white text-stone-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:bg-stone-50 flex items-center gap-1.5 transition transform translate-y-2 group-hover:translate-y-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Rápida</span>
          </button>
        </div>

        {/* Stock pill */}
        <div className="absolute bottom-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
              Agotado
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600/90 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
              ¡Últimas {product.stock} unids!
            </span>
          ) : (
            <span className="bg-stone-900/75 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
              Stock: {product.stock}
            </span>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-medium text-stone-600 uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            <span className="text-[10px] font-mono text-stone-400">{product.sku}</span>
          </div>

          <h3 className="text-sm font-semibold text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.title}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-stone-800">{product.rating}</span>
            <span className="text-[11px] text-stone-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Price & Cart CTA */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-stone-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
