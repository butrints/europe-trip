import { ref } from 'vue';
import type { LatLng } from '@/types/trip';

export interface WxDay { date: string; code: number; tmax: number; tmin: number; rain: number; sunrise: string; sunset: string }

const cache = new Map<string, { at: number; days: WxDay[] }>();

/** Open-Meteo, no key. 16-day forecast max; for dates further out returns []. */
export function useWeather(pos: LatLng, tz: string) {
  const days = ref<WxDay[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const key = `${pos.lat.toFixed(2)},${pos.lng.toFixed(2)}`;

  async function load() {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 30 * 60_000) { days.value = hit.days; return; }
    loading.value = true; error.value = null;
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        latitude: String(pos.lat), longitude: String(pos.lng), timezone: tz, forecast_days: '16',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      }).toString();
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const d = j.daily;
      const out: WxDay[] = d.time.map((t: string, i: number) => ({
        date: t, code: d.weather_code[i], tmax: Math.round(d.temperature_2m_max[i]), tmin: Math.round(d.temperature_2m_min[i]),
        rain: d.precipitation_probability_max[i] ?? 0,
        sunrise: String(d.sunrise[i]).slice(11, 16), sunset: String(d.sunset[i]).slice(11, 16),
      }));
      cache.set(key, { at: Date.now(), days: out });
      days.value = out;
    } catch (e) {
      error.value = (e as Error).message;
    } finally { loading.value = false; }
  }
  load();
  return { days, loading, error, reload: load };
}

export function wxIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '❄️';
  return '⛈️';
}
export function wxLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunder';
}
