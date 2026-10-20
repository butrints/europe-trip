import { onScopeDispose, ref } from 'vue';

export interface Departure {
  time: Date;
  delayMin: number;
  canceled: boolean;
  platform: string;
  platformChanged: boolean;
  vehicle: string;         // 'IC 1234' / 'EC ...'
  duration: string;        // '1h 52'
  transfers: number;
  arrival: Date;
  arrivalDelayMin: number;
}

const fmtDur = (sec: number) => { const m = Math.round(sec / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };

/** iRail connections API (NMBS/SNCB, no key, CORS ok). */
export function useLiveTrains(from: string, to: string, autoRefreshMs = 90_000) {
  const deps = ref<Departure[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const updated = ref<Date | null>(null);
  let timer: number | undefined;

  async function load() {
    loading.value = true; error.value = null;
    try {
      const url = new URL('https://api.irail.be/connections/');
      url.search = new URLSearchParams({ from, to, format: 'json', lang: 'en', typeOfTransport: 'trains' }).toString();
      const r = await fetch(url, { headers: { 'User-Agent': 'europe-trip (personal trip planner)' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const list = (j.connection ?? []) as any[];
      deps.value = list.map((c) => {
        const d = c.departure, a = c.arrival;
        const vehicle = String(d.vehicleinfo?.shortname ?? d.vehicle ?? '').replace('BE.NMBS.', '');
        return {
          time: new Date(Number(d.time) * 1000),
          delayMin: Math.round(Number(d.delay ?? 0) / 60),
          canceled: d.canceled === '1',
          platform: d.platform ?? '?',
          platformChanged: d.platforminfo?.normal === '0',
          vehicle,
          duration: fmtDur(Number(c.duration)),
          transfers: Number(c.vias?.number ?? 0),
          arrival: new Date(Number(a.time) * 1000),
          arrivalDelayMin: Math.round(Number(a.delay ?? 0) / 60),
        } satisfies Departure;
      });
      updated.value = new Date();
    } catch (e) {
      error.value = (e as Error).message;
    } finally { loading.value = false; }
  }

  load();
  timer = window.setInterval(load, autoRefreshMs);
  onScopeDispose(() => { if (timer) clearInterval(timer); });
  return { deps, loading, error, updated, reload: load };
}
