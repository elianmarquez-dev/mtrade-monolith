import React, { FormEvent, useState } from 'react';
import { ImagePlus, LoaderCircle, Plus, X } from 'lucide-react';
import { productsService } from '../services';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  imageUrl: string;
  sku: string;
  tags: string;
};

const initialForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  imageUrl: '',
  sku: '',
  tags: '',
};

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const updateField = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setError(t('Completa nombre, precio válido y stock entero no negativo.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const product = await productsService.createProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        stock,
        category: form.category.trim() || 'General',
        imageUrl: form.imageUrl.trim(),
        sku: form.sku.trim() || undefined,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      onCreated(product);
      setForm(initialForm);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('No se pudo crear el producto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Products Service</p>
            <h2 className="text-xl font-bold text-stone-900">{t('Agregar producto')}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100" aria-label={t('Cerrar')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          <label className="sm:col-span-2 text-sm font-semibold text-stone-700">{t('Nombre *')}
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-stone-700">{t('Descripción')}
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="text-sm font-semibold text-stone-700">{t('Precio *')}
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="text-sm font-semibold text-stone-700">{t('Stock *')}
            <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="text-sm font-semibold text-stone-700">{t('Categoría')}
            <input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="General" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="text-sm font-semibold text-stone-700">SKU
            <input value={form.sku} onChange={(event) => updateField('sku', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-stone-700"><span className="inline-flex items-center gap-1.5">{t('Imagen')} <ImagePlus className="w-3.5 h-3.5 text-stone-400" /></span>
            <input type="url" value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-stone-700">{t('Etiquetas')}
            <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder={t('hogar, nuevo, oferta')} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-emerald-600 focus:outline-none" />
          </label>
        </div>

        {error && <p className="mx-6 mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100">{t('Cancelar')}</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60">
            {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSubmitting ? t('Guardando...') : t('Crear producto')}
          </button>
        </div>
      </form>
    </div>
  );
};
