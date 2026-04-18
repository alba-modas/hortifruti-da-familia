import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Package, ShoppingCart, Settings, LogOut, LayoutDashboard, FolderOpen, Loader2, Bell, BellOff } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useNewOrderSound } from '@/lib/use-new-order-sound';
import { useOrders } from '@/lib/hooks';

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [{ title: 'Painel Admin - Hortifruti da Família' }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useNewOrderSound();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Início', exact: true },
    { to: '/admin/products', icon: Package, label: 'Produtos' },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categorias' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Pedidos' },
    { to: '/admin/settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="font-extrabold text-primary flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" /> Admin
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Som de novos pedidos: ATIVO' : 'Som de novos pedidos: SILENCIADO'}
            aria-label="Alternar som de novos pedidos"
            className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-card border-t fixed bottom-0 left-0 right-0 z-40">
        <div className="flex justify-around max-w-4xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? location.pathname === item.to : isActive(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-bold transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-right" richColors />
    </div>
  );
}
