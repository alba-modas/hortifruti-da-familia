import { Apple, Leaf, Carrot, ShoppingBasket, PawPrint, Tag } from 'lucide-react';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Frutas': Apple,
  'Verduras': Leaf,
  'Legumes': Carrot,
  'Mercearia': ShoppingBasket,
  'Rações / Pet': PawPrint,
  'Promoções do Dia': Tag,
};

interface CategoryBarProps {
  categories: { id: string; name: string }[];
  activeCategory: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryBar({ categories, activeCategory, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col items-center gap-1 min-w-[72px] px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          activeCategory === null
            ? 'bg-primary text-primary-foreground shadow-md scale-105'
            : 'bg-card text-foreground shadow-sm hover:bg-secondary'
        }`}
      >
        <ShoppingBasket className="w-5 h-5" />
        Todos
      </button>
      {categories.map((cat) => {
        const Icon = categoryIcons[cat.name] || ShoppingBasket;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-1 min-w-[72px] px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-card text-foreground shadow-sm hover:bg-secondary'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="whitespace-nowrap">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
