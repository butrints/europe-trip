import type { TripMeta } from '@/types/trip';

/** Registry of trips. Add a folder under src/trips/<slug>/ and register it here. */
export const TRIPS: TripMeta[] = [
  {
    slug: 'belgium-2026',
    title: 'Antwerp & Amsterdam',
    kicker: 'Winter in Flanders, a day in Holland',
    flag: '🇧🇪',
    start: '2026-12-03',
    end: '2026-12-08',
    cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Grote_Markt_%28Antwerpen%29.jpg/1280px-Grote_Markt_%28Antwerpen%29.jpg',
    load: () => import('./belgium-2026'),
  },
];

export const tripMeta = (slug: string) => TRIPS.find((t) => t.slug === slug);
