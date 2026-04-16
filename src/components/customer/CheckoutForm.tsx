import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { ArrowLeft, Send, MapPin, CreditCard, Banknote, QrCode } from 'lucide-react';

interface CheckoutFormProps {
  onBack: () => void;
  onClose: () => void;
}

export function CheckoutForm({ onBack, onClose }: CheckoutFormProps) {
  const { items, getTotal } = useCartStore();
  const total = getTotal();

  const [name, setName] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'pix' | 'cash' | 'card'>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Informe seu nome';
    if (orderType === 'delivery' && !address.trim()) e.address = 'Informe o endereço';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const whatsappNumber = '5522997639249';

    let msg = `🛒 *NOVO PEDIDO - Hortifruti da Família*\n\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `📋 *Tipo:* ${orderType === 'delivery' ? '🛵 Entrega' : '🏪 Retirada no local'}\n`;
    if (orderType === 'delivery') {
      msg += `📍 *Endereço:* ${address}\n`;
    }
    msg += `💳 *Pagamento:* ${payment === 'pix' ? 'PIX' : payment === 'cash' ? 'Dinheiro' : 'Cartão'}\n`;
    if (payment === 'cash' && needsChange && changeAmount) {
      msg += `💰 *Troco para:* R$ ${changeAmount}\n`;
    }
    msg += `\n📦 *Itens do pedido:*\n`;
    msg += `─────────────────\n`;

    items.forEach((item) => {
      const subtotal = item.product.price * item.quantity;
      msg += `• ${item.product.name} x${item.quantity} (${item.product.unit}) = R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    });

    msg += `─────────────────\n`;
    msg += `\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
    onClose();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
      </button>

      {/* Name */}
      <div>
        <label className="block text-sm font-bold mb-1">Seu nome *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Maria Silva"
          className="w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-base"
        />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Order type */}
      <div>
        <label className="block text-sm font-bold mb-2">Tipo do pedido *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType('delivery')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all ${
              orderType === 'delivery' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground'
            }`}
          >
            🛵 Entrega
          </button>
          <button
            onClick={() => setOrderType('pickup')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all ${
              orderType === 'pickup' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground'
            }`}
          >
            🏪 Retirada
          </button>
        </div>
      </div>

      {/* Address */}
      {orderType === 'delivery' && (
        <div>
          <label className="block text-sm font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" /> Endereço completo *
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, bairro, referência..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-base resize-none"
          />
          {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
        </div>
      )}

      {/* Payment */}
      <div>
        <label className="block text-sm font-bold mb-2">Forma de pagamento *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'pix' as const, label: 'PIX', icon: <QrCode className="w-4 h-4" /> },
            { value: 'cash' as const, label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
            { value: 'card' as const, label: 'Cartão', icon: <CreditCard className="w-4 h-4" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPayment(opt.value)}
              className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                payment === opt.value ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change */}
      {payment === 'cash' && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={needsChange}
              onChange={(e) => setNeedsChange(e.target.checked)}
              className="rounded border-border accent-primary w-4 h-4"
            />
            <span className="font-bold">Preciso de troco</span>
          </label>
          {needsChange && (
            <input
              value={changeAmount}
              onChange={(e) => setChangeAmount(e.target.value)}
              placeholder="Troco para quanto? Ex: 50"
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-base"
            />
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span>{items.length} item(s)</span>
          <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full py-4 rounded-xl bg-success text-success-foreground font-extrabold text-base hover:bg-success/90 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg"
      >
        <Send className="w-5 h-5" /> Enviar Pedido via WhatsApp
      </button>
    </div>
  );
}
