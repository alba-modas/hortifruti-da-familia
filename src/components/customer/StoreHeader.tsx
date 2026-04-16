import { Store, Clock } from 'lucide-react';
import type { StoreSettings } from '@/lib/types';

interface StoreHeaderProps {
  settings?: StoreSettings | null;
}

export function StoreHeader({ settings }: StoreHeaderProps) {
  const name = settings?.store_name || 'Hortifruti da Família';

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center overflow-hidden">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold leading-tight">{name}</h1>
          <p className="text-xs opacity-80">Fresquinho todo dia 🍎🥬</p>
        </div>
        {settings?.opening_hours && (
          <div className="flex items-center gap-1 text-xs opacity-80">
            <Clock className="w-3 h-3" />
            <span>{settings.opening_hours}</span>
          </div>
        )}
      </div>
    </header>
  );
}
