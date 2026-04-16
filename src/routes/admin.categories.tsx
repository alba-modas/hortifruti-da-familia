import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useCategories } from '@/lib/hooks';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, X, Loader2, GripVertical } from 'lucide-react';

export const Route = createFileRoute('/admin/categories')({
  component: AdminCategories,
});

function AdminCategories() {
  const { categories } = useCategories();
  const [editing, setEditing] = useState<{ id?: string; name: string; sort_order: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editing.id) {
        await supabase.from('categories').update({ name: editing.name.trim(), sort_order: editing.sort_order }).eq('id', editing.id);
      } else {
        await supabase.from('categories').insert({ name: editing.name.trim(), sort_order: editing.sort_order });
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    await supabase.from('categories').delete().eq('id', id);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Categorias</h2>
        <button onClick={() => setEditing({ name: '', sort_order: categories.length + 1 })} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-card rounded-xl p-3 shadow-sm flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 font-bold text-sm">{c.name}</span>
            <span className="text-xs text-muted-foreground">Ordem: {c.sort_order}</span>
            <button onClick={() => setEditing({ id: c.id, name: c.name, sort_order: c.sort_order })} className="p-2 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative bg-card rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold">{editing.id ? 'Editar' : 'Nova'} Categoria</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Nome</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Ordem</label>
              <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
