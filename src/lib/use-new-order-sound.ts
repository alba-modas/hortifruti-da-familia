import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY = 'admin_sound_enabled';

/**
 * Plays a short two-tone "ding" using the Web Audio API.
 * No external audio file needed — works offline and is tiny.
 */
function playDing(ctx: AudioContext) {
  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0, dur: 0.18 },
    { freq: 1320, start: 0.18, dur: 0.28 },
  ];
  for (const t of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = t.freq;
    gain.gain.setValueAtTime(0.0001, now + t.start);
    gain.gain.exponentialRampToValueAtTime(0.35, now + t.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t.start);
    osc.stop(now + t.start + t.dur + 0.05);
  }
}

export function useNewOrderSound() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Persist preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    }
  }, [enabled]);

  // Lazily create AudioContext on first user interaction (browsers require this)
  useEffect(() => {
    const init = () => {
      if (!ctxRef.current) {
        try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          if (Ctx) ctxRef.current = new Ctx();
        } catch {
          /* ignore */
        }
      }
      if (ctxRef.current?.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  // Subscribe to new orders
  useEffect(() => {
    const channel = supabase
      .channel(`admin-new-orders-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const n = (payload.new as any)?.order_number;
          const name = (payload.new as any)?.customer_name;
          toast.success(`🛒 Novo pedido #${n ?? ''}${name ? ` — ${name}` : ''}`, {
            duration: 6000,
          });
          if (enabledRef.current && ctxRef.current) {
            try {
              if (ctxRef.current.state === 'suspended') {
                ctxRef.current.resume().catch(() => {});
              }
              playDing(ctxRef.current);
            } catch {
              /* ignore */
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { enabled, setEnabled };
}
