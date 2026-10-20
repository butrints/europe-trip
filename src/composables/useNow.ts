import { computed, onScopeDispose, ref } from 'vue';

const now = ref(new Date());
let timer: number | undefined;
let subscribers = 0;

/** Shared ticking clock (every 30s). */
export function useNow() {
  subscribers++;
  if (!timer) timer = window.setInterval(() => { now.value = new Date(); }, 30_000);
  onScopeDispose(() => {
    subscribers--;
    if (subscribers <= 0 && timer) { clearInterval(timer); timer = undefined; }
  });
  return now;
}

export const isoDate = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function fmtDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseIso(iso).toLocaleDateString('en-GB', opts);
}

export function fmtRange(start: string, end: string) {
  const s = parseIso(start), e = parseIso(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const sFmt = s.toLocaleDateString('en-GB', { day: 'numeric', month: sameMonth ? undefined : 'short' });
  const eFmt = e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${sFmt}–${eFmt}`;
}

/** Minutes since midnight for 'HH:MM'. */
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function useCountdown(startIso: string, endIso: string) {
  const now = useNow();
  return computed(() => {
    const start = parseIso(startIso), end = parseIso(endIso);
    end.setDate(end.getDate() + 1);
    const t = now.value.getTime();
    if (t < start.getTime()) {
      const ms = start.getTime() - t;
      const days = Math.floor(ms / 86_400_000);
      const hours = Math.floor((ms % 86_400_000) / 3_600_000);
      const mins = Math.floor((ms % 3_600_000) / 60_000);
      return { phase: 'before' as const, days, hours, mins };
    }
    if (t < end.getTime()) return { phase: 'during' as const, days: 0, hours: 0, mins: 0 };
    return { phase: 'after' as const, days: 0, hours: 0, mins: 0 };
  });
}
