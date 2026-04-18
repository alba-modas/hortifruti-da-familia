import { Plus, Minus, Tag, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/types';
import { motion } from 'framer-motion';
import { getThumbnailUrl } from '@/lib/image-utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { items, addItem, removeItem } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const [imgLoaded, setImgLoaded] = useState(false);

  const isLowStock = product.has_stock_control && product.stock_quantity != null && product.stock_minimum != null && product.stock_quantity <= product.stock_minimum && product.stock_quantity > 0;
  const isOutOfStock = !product.available || (product.has_stock_control && product.stock_quantity != null && product.stock_quantity <= 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-card rounded-2xl shadow-sm overflow-hidden border transition-shadow hover:shadow-md ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.is_promo && (
          <span className="inline-flex items-center gap-1 bg-promo text-promo-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" /> PROMOÇÃO
          </span>
        )}
        {isLowStock && (
          <span className="inline-flex items-center gap-1 bg-warning text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Últimas unid.
          </span>
        )}
      </div>

      {/* Image */}
      <div className="h-28 bg-secondary flex items-center justify-center overflow-hidden relative">
        {product.image_url ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 shimmer" aria-hidden="true" />}
            <img
              src={getThumbnailUrl(product.image_url)}
              alt={product.name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              {...(priority ? { fetchPriority: 'high' as const } : {})}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <span className="text-3xl">
            {product.category_id === '1' ? '🍎' : product.category_id === '2' ? '🥬' : product.category_id === '3' ? '🥕' : product.category_id === '4' ? '🛒' : product.category_id === '5' ? '🐾' : '📦'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground leading-tight truncate">{product.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-lg font-extrabold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-xs text-muted-foreground">/{product.unit}</span>
        </div>

        {/* Add/Remove */}
        {isOutOfStock ? (
          <div className="mt-2 text-center text-xs font-bold text-destructive bg-destructive/10 py-2 rounded-lg">
            Indisponível
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-3">
            {quantity > 0 ? (
              <>
                <button
                  onClick={() => removeItem(product.id)}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-extrabold min-w-[28px] text-center">{quantity}</span>
                <button
                  onClick={() => addItem(product)}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => addItem(product)}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
