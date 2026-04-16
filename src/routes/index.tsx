import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { StoreHeader } from '@/components/customer/StoreHeader';
import { CategoryBar } from '@/components/customer/CategoryBar';
import { ProductCard } from '@/components/customer/ProductCard';
import { FloatingCart } from '@/components/customer/FloatingCart';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Hortifruti da Família - Peça Online' },
      { name: 'description', content: 'Frutas, verduras e legumes fresquinhos. Monte seu pedido online e receba em casa!' },
      { property: 'og:title', content: 'Hortifruti da Família' },
      { property: 'og:description', content: 'Monte seu pedido online e receba em casa!' },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const promoProducts = MOCK_PRODUCTS.filter((p) => p.is_promo && p.available);

  const filteredProducts = useMemo(() => {
    let products = MOCK_PRODUCTS;
    if (activeCategory) {
      products = products.filter((p) => p.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }
    return products;
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <StoreHeader />

      {/* Search */}
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

      {/* Categories */}
      <div className="max-w-2xl mx-auto">
        <CategoryBar
          categories={MOCK_CATEGORIES}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* Promos section */}
      {!activeCategory && !search && promoProducts.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <h2 className="text-base font-extrabold mb-2 flex items-center gap-1">
            🔥 Promoções do Dia
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {promoProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* All products */}
      <div className="max-w-2xl mx-auto px-4">
        {(activeCategory || search) && (
          <h2 className="text-base font-extrabold mb-2">
            {activeCategory
              ? MOCK_CATEGORIES.find((c) => c.id === activeCategory)?.name || 'Produtos'
              : `Resultados para "${search}"`}
          </h2>
        )}
        {!activeCategory && !search && (
          <h2 className="text-base font-extrabold mb-2">Todos os Produtos</h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado</p>
        )}
      </div>

      <FloatingCart />
    </div>
  );
}
