import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useOrders } from '@/lib/hooks';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Clock, Package, CheckCircle, Truck, Store, Eye } from 'lucide-react';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    refetch();
  };

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-xl font-extrabold">Pedidos</h2>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
          Todos ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
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
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido</p>}
      </div>
    </div>
  );
}
