import { Store } from 'lucide-react';

export function StoreHeader() {
  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">Hortifruti da Família</h1>
          <p className="text-xs opacity-80">Fresquinho todo dia 🍎🥬</p>
        </div>
      </div>
    </header>
  );
}
