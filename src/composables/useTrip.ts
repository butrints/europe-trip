import { computed, inject, provide, type InjectionKey, type Ref } from 'vue';
import type { TripData, Place, Route, Day, LatLng } from '@/types/trip';

const KEY: InjectionKey<Ref<TripData>> = Symbol('trip');

export function provideTrip(trip: Ref<TripData>) { provide(KEY, trip); }

export function useTrip() {
  const trip = inject(KEY);
  if (!trip) throw new Error('useTrip() outside trip scope');
  const placeById = computed(() => new Map(trip.value.places.map((p) => [p.id, p])));
  const routeById = computed(() => new Map(trip.value.routes.map((r) => [r.id, r])));
  const cityById = computed(() => new Map(trip.value.cities.map((c) => [c.id, c])));
  const place = (id?: string): Place | undefined => (id ? placeById.value.get(id) : undefined);
  const route = (id?: string): Route | undefined => (id ? routeById.value.get(id) : undefined);
  const city = (id: string) => cityById.value.get(id);
  const dayByDate = (date: string): Day | undefined => trip.value.days.find((d) => d.date === date);
  return { trip, place, route, city, dayByDate };
}

/** Deep links for navigation apps (transit mode). */
export function navLinks(origin: LatLng | undefined, dest: LatLng, destName?: string) {
  const o = origin ? `${origin.lat},${origin.lng}` : '';
  const d = `${dest.lat},${dest.lng}`;
  const q = destName ? encodeURIComponent(destName) : d;
  return {
    google: `https://www.google.com/maps/dir/?api=1${o ? `&origin=${o}` : ''}&destination=${d}&travelmode=transit`,
    apple: `https://maps.apple.com/?daddr=${d}${o ? `&saddr=${o}` : ''}&dirflg=r`,
    citymapper: `https://citymapper.com/directions?endcoord=${d}${destName ? `&endname=${q}` : ''}${o ? `&startcoord=${o}` : ''}`,
  };
}

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
