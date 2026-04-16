import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, CheckCircle, Truck, Store, Clock, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/pedido/$orderId')({
  head: () => ({
    meta: [{ title: 'Acompanhar Pedido - Hortifruti da Família' }],
  }),
  component: OrderTrackingPage,
});

const STATUS_CONFIG = [
  { key: 'received', label: 'Pedido Recebido', icon: Clock, color: 'text-blue-500' },
  { key: 'preparing', label: 'Em Preparação', icon: Package, color: 'text-warning' },
  { key: 'ready_pickup', label: 'Pronto para Retirada', icon: Store, color: 'text-primary' },
  { key: 'out_for_delivery', label: 'Em Rota de Entrega', icon: Truck, color: 'text-primary' },
  { key: 'completed', label: 'Finalizado', icon: CheckCircle, color: 'text-success' },
];

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-extrabold">Pedido não encontrado</h1>
          <Link to="/" className="text-primary underline">Voltar à loja</Link>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_CONFIG.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-extrabold">Pedido #{order.order_number}</h1>
            <p className="text-xs opacity-80">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Status timeline */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <h2 className="font-extrabold mb-4">Status do Pedido</h2>
          <div className="space-y-4">
            {STATUS_CONFIG.map((s, i) => {
              const Icon = s.icon;
              const isActive = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                  {isCurrent && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Atual</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-extrabold">Detalhes</h2>
          <div className="text-sm space-y-1">
            <p><strong>Cliente:</strong> {order.customer_name}</p>
            <p><strong>Tipo:</strong> {order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</p>
            {order.address && <p><strong>Endereço:</strong> {order.address}</p>}
            <p><strong>Pagamento:</strong> {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'cash' ? 'Dinheiro' : 'Cartão'}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-extrabold">Itens</h2>
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product_name} x{item.quantity} ({item.unit})</span>
              <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Taxa de entrega</span>
              <span>R$ {Number(order.delivery_fee).toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-primary border-t pt-2">
            <span>Total</span>
            <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
