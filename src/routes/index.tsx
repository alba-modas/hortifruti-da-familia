import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { StoreHeader } from '@/components/customer/StoreHeader';
import { CategoryBar } from '@/components/customer/CategoryBar';
import { ProductCard } from '@/components/customer/ProductCard';
import { FloatingCart } from '@/components/customer/FloatingCart';
import { useCategories, useProducts, useStoreSettings } from '@/lib/hooks';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Hortifruti da Família - Peça Online' },
      { name: 'description', content: 'Frutas, verduras e legumes fresquinhos. Monte seu pedido online e receba em casa!' },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { categories, loading: catLoading } = useCategories();
  const { products, loading: prodLoading } = useProducts();
  const { settings } = useStoreSettings();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const availableProducts = products.filter((p) => p.available);
  const promoProducts = availableProducts.filter((p) => p.is_promo);

  const filteredProducts = useMemo(() => {
    let list = availableProducts;
    if (activeCategory) {
      list = list.filter((p) => p.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [availableProducts, activeCategory, search]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategory, search]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = filteredProducts.length > visibleCount;

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + 12);
        }
      },
      { rootMargin: '400px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, filteredProducts.length]);

  const loading = catLoading || prodLoading;

  if (settings && !settings.is_open) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-16 h-16 mx-auto text-warning" />
          <h1 className="text-2xl font-extrabold">Estamos Fechados</h1>
          <p className="text-muted-foreground">
            Nosso horário de funcionamento: <strong>{settings.opening_hours}</strong>
          </p>
          <p className="text-sm text-muted-foreground">Volte em breve! 🍎</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <StoreHeader settings={settings} />

      {/* Sticky Search + Categories */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {!loading && (
          <div className="max-w-2xl mx-auto">
            <CategoryBar categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Promos */}
          {!activeCategory && !search && promoProducts.length > 0 && (
            <div className="max-w-2xl mx-auto px-4 mb-4">
              <h2 className="text-base font-extrabold mb-2 flex items-center gap-1">🔥 Promoções do Dia</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {promoProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 4} />
                ))}
              </div>
            </div>
          )}

          {/* All products */}
          <div className="max-w-2xl mx-auto px-4">
            {(activeCategory || search) && (
              <h2 className="text-base font-extrabold mb-2">
                {activeCategory ? categories.find((c) => c.id === activeCategory)?.name || 'Produtos' : `Resultados para "${search}"`}
              </h2>
            )}
            {!activeCategory && !search && <h2 className="text-base font-extrabold mb-2">Todos os Produtos</h2>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={!promoProducts.length && i < 4} />
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center items-center py-6" aria-hidden="true">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
            {filteredProducts.length === 0 && <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado</p>}
          </div>
        </>
      )}

      <FloatingCart />
    </div>
  );
}
