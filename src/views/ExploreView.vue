<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTrip, distanceKm } from '@/composables/useTrip';
import { useChecklist, useStored } from '@/composables/useStore';
import { usePicks } from '@/composables/usePicks';
import Icon from '@/components/ui/Icon.vue';
import PlaceCard from '@/components/PlaceCard.vue';

const { trip } = useTrip();
const t = trip.value;
const visited = useChecklist(`${t.slug}:visited`);
const picks = usePicks(t.slug);
const q = ref('');
const filter = useStored<string>(`et:${t.slug}:explore:filter`, 'all');
const cityF = useStored<string>(`et:${t.slug}:explore:city`, 'all');

const filters = [
  { id: 'all', label: 'All' },
  { id: 'must', label: 'Must-see', icon: 'star' },
  { id: 'xmas', label: 'Christmas', icon: 'gift' },
  { id: 'food', label: 'Eat & drink', icon: 'food' },
  { id: 'view', label: 'Views', icon: 'eye' },
  { id: 'museum', label: 'Museums', icon: 'museum' },
  { id: 'free', label: 'Free', icon: 'sparkle' },
  { id: 'rainy', label: 'Rainy day', icon: 'cloud' },
  { id: 'evening', label: 'After dark', icon: 'moon' },
  { id: 'shop', label: 'Shops', icon: 'bag' },
];

const list = computed(() => {
  const s = q.value.trim().toLowerCase();
  return t.places
    .filter((p) => p.cat !== 'stay' && p.cat !== 'station')
    .filter((p) => cityF.value === 'all' || p.city === cityF.value)
    .filter((p) => {
      const f = filter.value;
      if (f === 'all') return true;
      if (f === 'must') return p.rating === 3;
      if (f === 'food') return ['food', 'cafe', 'bar', 'market'].includes(p.cat);
      if (f === 'shop') return ['shop', 'market'].includes(p.cat);
      if (f === 'xmas' || f === 'view' || f === 'museum') return p.cat === f;
      return p.tags?.includes(f);
    })
    .filter((p) => !s || `${p.name} ${p.blurb} ${p.tags?.join(' ')} ${p.stop ?? ''} ${p.address ?? ''}`.toLowerCase().includes(s))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
});
const dist = (p: { pos: { lat: number; lng: number } }) => {
  if (!t.base.confirmed) return undefined;
  const km = distanceKm(t.base.pos, p.pos);
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};
const pickedCount = computed(() => Object.values(picks.map.value).reduce((n, a) => n + a.length, 0));
</script>

<template>
  <main class="page">
    <header class="ph">
      <p class="eyebrow">{{ t.places.length }} places · {{ pickedCount }} picked · {{ visited.set.value.length }} visited</p>
      <h1 class="display">Explore</h1>
    </header>

    <div class="search">
      <Icon name="search" />
      <input v-model="q" type="search" placeholder="Search places, stops, tags…" autocomplete="off" />
      <button v-if="q" class="clear" aria-label="Clear" @click="q = ''"><Icon name="close" :size="14" /></button>
    </div>

    <div v-if="t.cities.length > 1" class="seg">
      <button :class="{ active: cityF === 'all' }" @click="cityF = 'all'">All</button>
      <button v-for="c in t.cities" :key="c.id" :class="{ active: cityF === c.id }" @click="cityF = c.id">{{ c.name }}</button>
    </div>

    <nav class="chips">
      <button v-for="f in filters" :key="f.id" class="chip" :class="{ active: filter === f.id }" @click="filter = f.id">
        <Icon v-if="f.icon" :name="f.icon" />{{ f.label }}
      </button>
    </nav>

    <div class="grid">
      <PlaceCard v-for="p in list" :key="p.id" :place="p" :visited="visited.has(p.id)" :picked="picks.daysWith(p.id).length > 0" :distance="dist(p)" />
    </div>
    <div v-if="!list.length" class="empty"><p class="display">Nothing here</p>Try another filter.</div>
  </main>
</template>

<style scoped>
.ph { padding: 24px 0 14px; }
.ph h1 { font-size: 2.25rem; }
.search { position: relative; }
.search input { width: 100%; height: 46px; padding: 0 40px 0 42px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); outline: none; transition: border-color .15s, box-shadow .15s; -webkit-appearance: none; }
.search input:focus { border-color: var(--ember); box-shadow: 0 0 0 4px var(--ember-soft); }
.search .ic { position: absolute; left: 13px; top: 13px; color: var(--ink-3); }
.clear { position: absolute; right: 9px; top: 9px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--paper-2); color: var(--ink-2); }
.seg { display: inline-flex; background: var(--paper-2); border-radius: var(--r-pill); padding: 3px; gap: 2px; margin-top: 12px; }
:root[data-theme="dark"] .seg { background: var(--card-2); }
.seg button { padding: 7px 14px; border-radius: var(--r-pill); font-size: 0.8125rem; font-weight: 600; color: var(--ink-2); transition: all .2s var(--ease); }
.seg button.active { background: var(--card); color: var(--ink); box-shadow: var(--shadow-1); }
.chips { margin-top: 10px; }
.grid { display: grid; gap: 12px; margin-top: 6px; }
@media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
</style>
