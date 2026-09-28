import React, { useEffect, useState } from 'react';
import { X, Star, ShoppingBag, Truck, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { Product, ProductReview } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { productsService } from '../services';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onReviewSubmitted }) => {
  const { addItem, openCheckout } = useCart();
  const { session, openAuthModal } = useAuth();
  const { language, t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!product) {
      setReviews([]);
      setReviewComment('');
      setReviewRating(5);
      return;
    }

    let active = true;
    setIsLoadingReviews(true);
    setReviewError('');
    productsService.getProductReviews(product.id)
      .then((productReviews) => {
        if (!active) return;
        setReviews(productReviews);
        const ownReview = productReviews.find((review) => review.userId === session?.id);
        if (ownReview) {
          setReviewRating(ownReview.rating);
          setReviewComment(ownReview.comment);
        } else {
          setReviewRating(5);
          setReviewComment('');
        }
      })
      .catch(() => {
        if (active) setReviewError(t('Could not load reviews.'));
      })
      .finally(() => {
        if (active) setIsLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, [product?.id, session?.id]);

  if (!product) return null;

  const isOwner = Boolean(session && product.ownerId === session.id);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : product.rating;

  const handleAddToCart = () => {
    if (!session) {
      openAuthModal('login');
      return;
    }

    if (isOwner || !addItem(product, quantity)) return;
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1600);
  };

  const handleBuyNow = () => {
    if (!session) {
      openAuthModal('login');
      return;
    }

    if (isOwner || !addItem(product, quantity)) return;
    onClose();
    openCheckout();
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) {
      openAuthModal('login');
      return;
    }
    if (isOwner) return;
    if (!reviewComment.trim()) {
      setReviewError(t('Review comment is required'));
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const review = await productsService.createProductReview(product.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews((current) => [
        review,
        ...current.filter((item) => item.userId !== review.userId),
      ]);
      onReviewSubmitted?.();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : t('Could not load reviews.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-stone-400 hover:text-stone-700 bg-white/80 hover:bg-white rounded-full transition shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto bg-stone-100 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {product.compareAtPrice && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
                {t('OFERTA')}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-semibold text-emerald-700 uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                  {product.sku}
                </span>
              </div>

              <h2 className="text-xl font-bold text-stone-900 leading-snug">
                {product.title}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating) ? 'fill-current' : 'text-stone-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-stone-800">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-stone-400">{t('({count} opiniones verificadas)', { count: reviews.length || product.reviewsCount })}</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-black text-stone-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-stone-500 font-medium ml-auto">
                  {t('Stock disponible:')} <strong className="text-stone-800">{product.stock}</strong> {t('unids.')}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-stone-600 leading-relaxed mt-4">
                {product.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>{t('Envío seguro y express')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t('Garantía de 12 meses')}</span>
                </div>
              </div>

              <section className="mt-4 border-t border-stone-100 pt-4">
                <h3 className="text-sm font-bold text-stone-900">
                  {t('Reviews ({count})', { count: reviews.length })}
                </h3>
                {isLoadingReviews ? (
                  <p className="mt-2 text-xs text-stone-500">{t('Loading reviews...')}</p>
                ) : reviews.length === 0 ? (
                  <p className="mt-2 text-xs text-stone-500">{t('No reviews yet.')}</p>
                ) : (
                  <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
                    {reviews.map((review) => (
                      <article key={review.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-stone-800">{review.authorName}</span>
                          <div className="flex shrink-0 items-center gap-1 text-amber-500" aria-label={`${review.rating}/5`}>
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[11px] font-bold">{review.rating}</span>
                          </div>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-stone-600">{review.comment}</p>
                        <time className="mt-1 block text-[10px] text-stone-400">
                          {new Date(review.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES')}
                        </time>
                      </article>
                    ))}
                  </div>
                )}

                {isOwner ? (
                  <p className="mt-3 text-xs text-stone-500">{t('You cannot review your own listing.')}</p>
                ) : session ? (
                  <form onSubmit={handleSubmitReview} className="mt-3 space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">{t('Your rating')}</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          aria-label={t('Rate {count} stars', { count: rating })}
                          aria-pressed={reviewRating === rating}
                          onClick={() => setReviewRating(rating)}
                          className="p-0.5 text-amber-500"
                        >
                          <Star className={`h-4 w-4 ${rating <= reviewRating ? 'fill-current' : 'text-stone-300'}`} />
                        </button>
                      ))}
                    </div>
                    <label className="sr-only" htmlFor="product-review-comment">{t('Share your experience with this product.')}</label>
                    <textarea
                      id="product-review-comment"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      maxLength={2000}
                      rows={2}
                      placeholder={t('Write a comment...')}
                      className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-emerald-600 focus:outline-none"
                    />
                    {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewComment.trim()}
                      className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmittingReview
                        ? t('Loading reviews...')
                        : reviews.some((review) => review.userId === session.id)
                          ? t('Update review')
                          : t('Post review')}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {t('Sign in to leave a review')}
                  </button>
                )}
              </section>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-xs font-semibold text-stone-700">{t('Cantidad:')}</span>
                <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 disabled:opacity-40 transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold text-stone-900 bg-white min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="px-3 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 disabled:opacity-40 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isOwner}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                    isOutOfStock || isOwner
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                  }`}
                >
                  {isOwner ? (
                    <span>{t('Your listing')}</span>
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('Agregado al Carrito')}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t('Añadir al Carrito')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isOwner}
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <span>{t('Comprar Ahora')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
