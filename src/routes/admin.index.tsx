import { createFileRoute, Link } from '@tanstack/react-router';
import { useProducts, useOrders, useCategories } from '@/lib/hooks';
import { Package, ShoppingCart, FolderOpen, AlertTriangle, TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();
  const { categories } = useCategories();

  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const lowStock = products.filter((p) => p.has_stock_control && p.stock_quantity != null && p.stock_minimum != null && p.stock_quantity <= p.stock_minimum && p.stock_quantity > 0);
  const pendingOrders = orders.filter((o) => o.status !== 'completed');

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-xl font-extrabold">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/orders" className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <p className="text-2xl font-extrabold">{pendingOrders.length}</p>
          <p className="text-xs text-muted-foreground">Pedidos pendentes</p>
        </Link>
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <TrendingUp className="w-6 h-6 text-success" />
          <p className="text-2xl font-extrabold">R$ {todayRevenue.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-muted-foreground">Vendas hoje</p>
        </div>
        <Link to="/admin/products" className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <Package className="w-6 h-6 text-primary" />
          <p className="text-2xl font-extrabold">{products.length}</p>
          <p className="text-xs text-muted-foreground">Produtos</p>
        </Link>
        <Link to="/admin/categories" className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <FolderOpen className="w-6 h-6 text-primary" />
          <p className="text-2xl font-extrabold">{categories.length}</p>
          <p className="text-xs text-muted-foreground">Categorias</p>
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-warning/10 rounded-2xl p-4 space-y-2">
          <h3 className="font-extrabold flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" /> Estoque Baixo
          </h3>
          {lowStock.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.name}</span>
              <span className="font-bold text-warning">{p.stock_quantity} restante(s)</span>
            </div>
          ))}
        </div>
      )}

      {todayOrders.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-extrabold">Pedidos de Hoje ({todayOrders.length})</h3>
          {todayOrders.slice(0, 5).map((o) => (
            <Link key={o.id} to="/admin/orders" className="flex justify-between text-sm border-b last:border-0 pb-2">
              <span>#{o.order_number} - {o.customer_name}</span>
              <span className="font-bold">R$ {Number(o.total).toFixed(2).replace('.', ',')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
