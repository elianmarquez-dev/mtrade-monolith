import React, { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal, PackageX, Sparkles, RefreshCw } from 'lucide-react';
import { Product, ProductFilter } from '../types';
import { productsService } from '../services';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  searchQuery: string;
  onQuickView: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery, onQuickView }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<ProductFilter['sortBy']>('rating');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await productsService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching categories from Products Service:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch products when filters or search change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const filter: ProductFilter = {
          category: selectedCategory,
          search: searchQuery,
          sortBy,
          inStockOnly
        };
        const list = await productsService.getProducts(filter);
        setProducts(list);
      } catch (err) {
        console.error('Error fetching products from Products Service:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, inStockOnly]);

  const handleResetFilters = () => {
    setSelectedCategory('Todos');
    setSortBy('rating');
    setInStockOnly(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Pills & Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          {/* In Stock toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-stone-600 hover:text-stone-900 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 w-3.5 h-3.5"
            />
            <span>Solo en stock</span>
          </label>

          <div className="h-4 w-px bg-stone-200" />

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-stone-600">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="rating">Mejor Calificados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between py-4 text-xs text-stone-500">
        <span>
          Mostrando <strong className="text-stone-800">{products.length}</strong> productos
          {searchQuery && (
            <> para la búsqueda "<strong className="text-stone-900">{searchQuery}</strong>"</>
          )}
        </span>
        <span className="font-mono text-[11px] text-stone-400">
          Products Service: 200 OK
        </span>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-stone-100 rounded-xl aspect-[3/4] animate-pulse border border-stone-200"
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} onQuickView={onQuickView} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
          <PackageX className="w-12 h-12 mx-auto text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No se encontraron productos</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            Intenta cambiar los términos de búsqueda o restablecer los filtros para ver todos los artículos del catálogo.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>
      )}
    </section>
  );
};
