import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useOrders, useStoreSettings } from '@/lib/hooks';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Clock, Package, CheckCircle, Truck, Store, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrders,
});

const STATUS_OPTIONS = [
  { value: 'received', label: 'Recebido', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  { value: 'preparing', label: 'Preparando', icon: Package, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ready_pickup', label: 'Pronto', icon: Store, color: 'bg-green-100 text-green-700' },
  { value: 'out_for_delivery', label: 'Em entrega', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: 'Finalizado', icon: CheckCircle, color: 'bg-gray-100 text-gray-700' },
];

function AdminOrders() {
  const { orders, refetch } = useOrders();
  const { settings } = useStoreSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'last7'>('all');
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (!settings || !deleteOrderId) return;
    const stored = (settings as any).delete_password || '';
    if (!stored) { setDeleteError('Senha de exclusão não configurada nas Configurações.'); return; }
    if (deletePassword !== stored) { setDeleteError('Senha incorreta.'); return; }
    await supabase.from('order_items').delete().eq('order_id', deleteOrderId);
    await supabase.from('orders').delete().eq('id', deleteOrderId);
    setDeleteOrderId(null);
    setDeletePassword('');
    setDeleteError('');
    refetch();
  };

  const matchesDate = (createdAt: string) => {
    if (dateFilter === 'all') return true;
    const created = new Date(createdAt);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'today') {
      const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
      return created >= startToday && created < endToday;
    }
    if (dateFilter === 'yesterday') {
      const startYesterday = new Date(startToday); startYesterday.setDate(startYesterday.getDate() - 1);
      return created >= startYesterday && created < startToday;
    }
    if (dateFilter === 'last7') {
      const start7 = new Date(startToday); start7.setDate(start7.getDate() - 6);
      return created >= start7;
    }
    return true;
  };

  const dateFiltered = orders.filter((o: any) => matchesDate(o.created_at));
  const filtered = filter === 'all' ? dateFiltered : dateFiltered.filter((o: any) => o.status === filter);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status: status as any }).eq('id', orderId);
    refetch();
  };

  const DATE_OPTIONS: { value: typeof dateFilter; label: string }[] = [
    { value: 'all', label: 'Todas as datas' },
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last7', label: 'Últimos 7 dias' },
  ];

  // Stats for today
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
  const todaysOrders = orders.filter((o: any) => {
    const c = new Date(o.created_at);
    return c >= startToday && c < endToday;
  });
  const totalSales = todaysOrders.reduce((sum, o: any) => sum + Number(o.total || 0), 0);
  const orderCount = todaysOrders.length;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-xl font-extrabold">Pedidos</h2>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Vendas Hoje</p>
          <p className="text-sm font-extrabold text-primary mt-1">{fmt(totalSales)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Ticket Médio</p>
          <p className="text-sm font-extrabold mt-1">{fmt(avgTicket)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Pedidos</p>
          <p className="text-sm font-extrabold mt-1">{orderCount}</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {DATE_OPTIONS.map((d) => (
          <button key={d.value} onClick={() => setDateFilter(d.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${dateFilter === d.value ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
          Todos ({dateFiltered.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const count = dateFiltered.filter((o) => o.status === s.value).length;
          return (
            <button key={s.value} onClick={() => setFilter(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === s.value ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {filtered.map((order) => {
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === order.status);
          const expanded = expandedId === order.id;
          const StatusIcon = statusOpt?.icon || Clock;

          return (
            <div key={order.id} className="bg-card rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setExpandedId(expanded ? null : order.id)} className="w-full p-3 flex items-center gap-3 text-left">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusOpt?.color || ''}`}>
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">#{order.order_number}</span>
                    <span className="text-xs text-muted-foreground">{order.customer_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <span className="font-bold text-sm text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expanded && (
                <div className="px-3 pb-3 space-y-3 border-t pt-3">
                  <div className="text-sm space-y-1">
                    <p><strong>Tipo:</strong> {order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</p>
                    {order.address && <p><strong>Endereço:</strong> {order.address}</p>}
                    <p><strong>Pagamento:</strong> {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'cash' ? 'Dinheiro' : 'Cartão'}</p>
                    {order.needs_change && <p><strong>Troco para:</strong> R$ {Number(order.change_amount).toFixed(2).replace('.', ',')}</p>}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold">Itens:</p>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.product_name} x{item.quantity} ({item.unit})</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-bold mb-2">Alterar Status:</p>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((s) => (
                        <button key={s.value} onClick={() => updateStatus(order.id, s.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${order.status === s.value ? 'ring-2 ring-primary' : ''} ${s.color}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => { setDeleteOrderId(order.id); setDeletePassword(''); setDeleteError(''); }}
                    className="w-full py-2 rounded-xl bg-destructive/10 text-destructive font-bold text-xs flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Excluir Pedido
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido</p>}
      </div>

      <Dialog open={!!deleteOrderId} onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Pedido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Digite a senha de exclusão para confirmar:</p>
          <input type="password" value={deletePassword} onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
            placeholder="Senha de exclusão" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
          {deleteError && <p className="text-xs text-destructive font-bold">{deleteError}</p>}
          <button onClick={handleDelete} className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-extrabold">
            Confirmar Exclusão
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
