import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useProducts, useCategories } from '@/lib/hooks';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Tag, Package, Search, X, Loader2, Camera, Upload } from 'lucide-react';
import type { Product } from '@/lib/types';

export const Route = createFileRoute('/admin/products')({
  component: AdminProducts,
});

const EMPTY_PRODUCT = {
  name: '', price: 0, unit: 'kg', category_id: '', image_url: '', available: true,
  has_stock_control: false, stock_quantity: 0, stock_minimum: 5, is_promo: false,
};

function AdminProducts() {
  const { products, refetch } = useProducts();
  const { categories } = useCategories();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!editing || !editing.name?.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        price: Number(editing.price) || 0,
        unit: editing.unit || 'kg',
        category_id: editing.category_id || null,
        image_url: editing.image_url || null,
        available: editing.available ?? true,
        has_stock_control: editing.has_stock_control ?? false,
        stock_quantity: editing.has_stock_control ? (editing.stock_quantity ?? 0) : 0,
        stock_minimum: editing.has_stock_control ? (editing.stock_minimum ?? 5) : 5,
        is_promo: editing.is_promo ?? false,
      };

      if (editing.id) {
        await supabase.from('products').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('products').insert(payload);
      }
      setEditing(null);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto permanentemente?')) return;
    await supabase.from('products').delete().eq('id', id);
    refetch();
  };

  const handleToggle = async (product: Product) => {
    await supabase.from('products').update({ available: !product.available }).eq('id', product.id);
    refetch();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setEditing({ ...editing, image_url: publicUrl });
    } catch (err) {
      console.error(err);
      alert('Erro no upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleStockAdjust = async (product: Product, amount: number) => {
    const newQty = Math.max(0, (product.stock_quantity || 0) + amount);
    await supabase.from('products').update({ stock_quantity: newQty }).eq('id', product.id);
    await supabase.from('stock_logs').insert({ product_id: product.id, quantity_change: amount, reason: `Ajuste manual: ${amount > 0 ? '+' : ''}${amount}` });
    refetch();
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Produtos</h2>
        <button onClick={() => setEditing({ ...EMPTY_PRODUCT })} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm" />
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className={`bg-card rounded-xl p-3 shadow-sm flex items-center gap-3 ${!p.available ? 'opacity-50' : ''}`}>
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-bold text-sm truncate">{p.name}</p>
                {p.is_promo && <Tag className="w-3 h-3 text-promo" />}
              </div>
              <p className="text-xs text-muted-foreground">R$ {Number(p.price).toFixed(2).replace('.', ',')} / {p.unit}</p>
              {p.has_stock_control && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Estoque: {p.stock_quantity}</span>
                  <div className="flex gap-1">
                    {[10, 20, 50].map((n) => (
                      <button key={n} onClick={() => handleStockAdjust(p, n)} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">+{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleToggle(p)} className={`text-xs px-2 py-1 rounded-lg font-bold ${p.available ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {p.available ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => setEditing({ ...p, price: Number(p.price) })} className="p-2 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum produto</p>}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative bg-card rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg">{editing.id ? 'Editar' : 'Novo'} Produto</h3>
              <button onClick={() => setEditing(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Nome *</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Preço *</label>
                <input type="number" step="0.01" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Unidade</label>
                <select value={editing.unit || 'kg'} onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                  <option value="kg">kg</option>
                  <option value="un">unidade</option>
                  <option value="pacote">pacote</option>
                  <option value="bandeja">bandeja</option>
                  <option value="maço">maço</option>
                  <option value="dúzia">dúzia</option>
                  <option value="litro">litro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Categoria</label>
              <select value={editing.category_id || ''} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-bold mb-1">Imagem</label>
              {editing.image_url && (
                <div className="relative w-24 h-24 mb-2">
                  <img src={editing.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => setEditing({ ...editing, image_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Enviando...' : 'Upload imagem'}
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_promo ?? false} onChange={(e) => setEditing({ ...editing, is_promo: e.target.checked })} className="accent-promo w-4 h-4" />
                <span className="font-bold">Promoção do dia</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.has_stock_control ?? false} onChange={(e) => setEditing({ ...editing, has_stock_control: e.target.checked })} className="accent-primary w-4 h-4" />
                <span className="font-bold">Controle de estoque</span>
              </label>
            </div>

            {editing.has_stock_control && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Qtd. estoque</label>
                  <input type="number" value={editing.stock_quantity ?? 0} onChange={(e) => setEditing({ ...editing, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Estoque mínimo</label>
                  <input type="number" value={editing.stock_minimum ?? 5} onChange={(e) => setEditing({ ...editing, stock_minimum: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
                </div>
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
