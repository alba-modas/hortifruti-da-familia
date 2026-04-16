import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckoutForm } from './CheckoutForm';

export function FloatingCart() {
  const { items, getTotal, getItemCount, removeItem, addItem, updateQuantity, clearCart } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && itemCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full shadow-xl px-5 py-3 flex items-center gap-2 font-bold text-base hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{itemCount}</span>
          <span className="text-sm">• R$ {total.toFixed(2).replace('.', ',')}</span>
        </motion.button>
      )}

      {/* Cart panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsOpen(false); setShowCheckout(false); }}
              className="fixed inset-0 bg-foreground/40 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  {showCheckout ? 'Finalizar Pedido' : `Carrinho (${itemCount})`}
                </h2>
                <button onClick={() => { setIsOpen(false); setShowCheckout(false); }} className="p-2 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showCheckout ? (
                <CheckoutForm onBack={() => setShowCheckout(false)} onClose={() => { setIsOpen(false); setShowCheckout(false); clearCart(); }} />
              ) : (
                <>
                  {/* Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Seu carrinho está vazio</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                          <div className="text-2xl">
                            {item.product.category_id === '1' ? '🍎' : item.product.category_id === '2' ? '🥬' : item.product.category_id === '3' ? '🥕' : '📦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.product.price.toFixed(2).replace('.', ',')} /{item.product.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeItem(item.product.id)} className="w-7 h-7 rounded-full bg-card flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-extrabold text-sm min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => addItem(item.product)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => updateQuantity(item.product.id, 0)} className="p-1 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {items.length > 0 && (
                    <div className="p-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-xl font-extrabold text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-base hover:bg-primary/90 active:scale-[0.98] transition-transform"
                      >
                        Finalizar Pedido
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
