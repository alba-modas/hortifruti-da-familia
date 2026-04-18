import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useStoreSettings } from '@/lib/hooks';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Upload, X } from 'lucide-react';
import { processLogo } from '@/lib/image-utils';

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, refetch } = useStoreSettings();
  const [form, setForm] = useState({
    store_name: '', whatsapp_primary: '', whatsapp_secondary: '', active_whatsapp: 'primary' as string,
    delivery_fee_enabled: false, delivery_fee_amount: 0, opening_hours: '', is_open: true, logo_url: '',
    delete_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name,
        whatsapp_primary: settings.whatsapp_primary,
        whatsapp_secondary: settings.whatsapp_secondary,
        active_whatsapp: settings.active_whatsapp,
        delivery_fee_enabled: settings.delivery_fee_enabled,
        delivery_fee_amount: Number(settings.delivery_fee_amount),
        opening_hours: settings.opening_hours,
        is_open: settings.is_open,
        logo_url: settings.logo_url || '',
        delete_password: (settings as any).delete_password || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings || saving) return;
    setSaving(true);
    try {
      await supabase.from('store_settings').update({
        store_name: form.store_name,
        whatsapp_primary: form.whatsapp_primary,
        whatsapp_secondary: form.whatsapp_secondary,
        active_whatsapp: form.active_whatsapp,
        delivery_fee_enabled: form.delivery_fee_enabled,
        delivery_fee_amount: form.delivery_fee_amount,
        opening_hours: form.opening_hours,
        is_open: form.is_open,
        logo_url: form.logo_url || null,
        delete_password: form.delete_password,
      }).eq('id', settings.id);
      refetch();
      alert('Configurações salvas!');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Resize logo to <=200px and convert to WebP for tiny header payload
      const optimized = await processLogo(file);
      const path = `logo/${Date.now()}.webp`;
      await supabase.storage.from('product-images').upload(path, optimized, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '31536000',
      });
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm({ ...form, logo_url: publicUrl });
    } finally {
      setUploading(false);
    }
  };

  if (!settings) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 pb-20 max-w-lg">
      <h2 className="text-xl font-extrabold">Configurações</h2>

      <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Nome da Loja</label>
          <input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Logo</label>
          {form.logo_url && (
            <div className="relative w-16 h-16 mb-2">
              <img src={form.logo_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
              <button onClick={() => setForm({ ...form, logo_url: '' })} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Enviando...' : 'Upload logo'}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">WhatsApp Principal</label>
          <input value={form.whatsapp_primary} onChange={(e) => setForm({ ...form, whatsapp_primary: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">WhatsApp Secundário</label>
          <input value={form.whatsapp_secondary} onChange={(e) => setForm({ ...form, whatsapp_secondary: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">WhatsApp Ativo</label>
          <select value={form.active_whatsapp} onChange={(e) => setForm({ ...form, active_whatsapp: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
            <option value="primary">Principal</option>
            <option value="secondary">Secundário</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Horário de Funcionamento</label>
          <input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" placeholder="Ex: 07:00 - 19:00" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} className="accent-primary w-4 h-4" />
          <span className="font-bold">Loja aberta</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.delivery_fee_enabled} onChange={(e) => setForm({ ...form, delivery_fee_enabled: e.target.checked })} className="accent-primary w-4 h-4" />
          <span className="font-bold">Cobrar taxa de entrega</span>
        </label>

        {form.delivery_fee_enabled && (
          <div>
            <label className="block text-sm font-bold mb-1">Valor da taxa (R$)</label>
            <input type="number" step="0.01" value={form.delivery_fee_amount} onChange={(e) => setForm({ ...form, delivery_fee_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold mb-1">Senha para exclusão de pedidos</label>
          <input type="password" value={form.delete_password} onChange={(e) => setForm({ ...form, delete_password: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" placeholder="Defina uma senha" />
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <h3 className="font-extrabold text-sm flex items-center gap-1"><Zap className="w-4 h-4 text-primary" /> Otimização de imagens</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Reprocessa todas as imagens antigas para WebP com versões thumb/full. Mantenha esta aba aberta durante o processo.
          </p>
        </div>
        {migrateProgress && migrateProgress.total > 0 && (
          <div className="space-y-1">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(migrateProgress.done / migrateProgress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {migrateProgress.done}/{migrateProgress.total} — ✓ {migrateProgress.ok} • ✗ {migrateProgress.fail}
            </p>
          </div>
        )}
        <button
          onClick={handleMigrateImages}
          disabled={migrating}
          className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {migrating ? 'Otimizando...' : 'Otimizar imagens antigas'}
        </button>
      </div>
    </div>
  );
}
