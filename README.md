# europe-trip

One app, many trips. Mobile-first travel companion: day plans with fixed anchors + a free-form pool of ideas you pick from, step-by-step transit routes with ticket instructions, live train departures, live weather, map, packing list, phrasebook. Installable PWA, works offline once opened.

**Stack:** Vite · Vue 3 · TypeScript · vue-router (hash history) · Leaflet · vite-plugin-pwa. No backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + dist/
```

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds on every push to `main` and deploys `dist/`.
In the repo settings → Pages → **Source: GitHub Actions** (one-time). The site lands at `https://<user>.github.io/europe-trip/`.

## Add a trip

1. Create `src/trips/<slug>/index.ts` exporting a `TripData` (see `src/types/trip.ts`; `belgium-2026` is the reference).
2. Register it in `src/trips/index.ts` (title, dates, cover, lazy `load`).

Per-trip content: `cities`, `base` (where you sleep — distances and "Navigate" use it), `places`, `routes` (step-by-step, with `ticket`/`warn` notes per leg), `days` (items **with** `time` are fixed anchors; items **without** are the ideas pool), `operators` (how tickets work), `live` (iRail station pairs for the departures board), `info` (packing, phrases, emergency, apps, facts).

## Live data (no keys)

- Trains: `api.irail.be` (NMBS/SNCB) — `src/composables/useLiveTrains.ts`
- Weather: `api.open-meteo.com` — `src/composables/useWeather.ts`
- Photos: Wikimedia Commons (`src/trips/<slug>/images.ts`)

## Local state

Done items, visited places, per-day picks, packing checks and theme live in `localStorage` (`et:*` keys). Nothing leaves the device.
