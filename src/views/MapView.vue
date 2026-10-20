<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTrip } from '@/composables/useTrip';
import { useChecklist } from '@/composables/useStore';
import { usePicks } from '@/composables/usePicks';
import { useTheme } from '@/composables/useTheme';
import type { Place, PlaceCategory } from '@/types/trip';
import Icon from '@/components/ui/Icon.vue';

const { trip } = useTrip();
const router = useRouter();
const t = trip.value;
const { isDark } = useTheme();
const visited = useChecklist(`${t.slug}:visited`);
const picks = usePicks(t.slug);

const el = ref<HTMLElement | null>(null);
const cityF = ref(t.cities[0].id);
const catF = ref<'all' | 'picked' | 'must' | 'xmas' | 'food' | 'view' | 'museum'>('all');
const selected = ref<Place | null>(null);
let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;

const colors: Record<PlaceCategory, string> = { sight: '#3A6EA5', view: '#1B9AAA', museum: '#7B4B94', food: '#D6A21E', cafe: '#A2845E', bar: '#A2845E', market: '#C0396B', xmas: '#C84B2F', shop: '#C0396B', park: '#1F6B52', station: '#14171F', stay: '#14171F' };
const matches = (p: Place) => {
  if (p.city !== cityF.value) return false;
  const f = catF.value;
  if (f === 'all') return true;
  if (f === 'picked') return picks.daysWith(p.id).length > 0;
  if (f === 'must') return p.rating === 3;
  if (f === 'food') return ['food', 'cafe', 'bar', 'market'].includes(p.cat);
  return p.cat === f;
};

function pinIcon(p: Place) {
  const c = colors[p.cat];
  const done = visited.has(p.id);
  const star = p.rating === 3 ? '★' : '';
  return L.divIcon({
    className: '',
    html: `<div class="pin${done ? ' done' : ''}" style="--c:${c}"><span>${star}</span></div>`,
    iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
  });
}

function render() {
  if (!map || !layer) return;
  layer.clearLayers();
  const bounds: L.LatLngExpression[] = [];
  if (t.base.confirmed && t.base.pos && cityF.value === t.cities[0].id) {
    L.marker([t.base.pos.lat, t.base.pos.lng], { icon: L.divIcon({ className: '', html: '<div class="pin base"><span>⌂</span></div>', iconSize: [30, 30], iconAnchor: [15, 15] }), zIndexOffset: 1000 })
      .bindTooltip('Apartment', { direction: 'top', offset: [0, -14] }).addTo(layer);
    bounds.push([t.base.pos.lat, t.base.pos.lng]);
  }
  t.places.filter(matches).forEach((p) => {
    const m = L.marker([p.pos.lat, p.pos.lng], { icon: pinIcon(p) }).addTo(layer!);
    m.on('click', () => { selected.value = p; });
    bounds.push([p.pos.lat, p.pos.lng]);
  });
  if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
}

onMounted(() => {
  map = L.map(el.value!, { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
  }).addTo(map);
  layer = L.layerGroup().addTo(map);
  map.on('click', () => { selected.value = null; });
  render();
});
onBeforeUnmount(() => { map?.remove(); map = null; });
watch([cityF, catF, () => visited.set.value, () => picks.map.value], render, { deep: true });
watch(isDark, () => map?.invalidateSize());

const cats: { id: typeof catF.value; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' }, { id: 'picked', label: 'My picks', icon: 'heart' }, { id: 'must', label: 'Must', icon: 'star' },
  { id: 'xmas', label: 'Christmas', icon: 'gift' }, { id: 'food', label: 'Food', icon: 'food' }, { id: 'view', label: 'Views', icon: 'eye' }, { id: 'museum', label: 'Museums', icon: 'museum' },
];
</script>

<template>
  <div class="mapwrap">
    <div ref="el" class="map" />
    <div class="top">
      <div v-if="t.cities.length > 1" class="seg">
        <button v-for="c in t.cities" :key="c.id" :class="{ active: cityF === c.id }" @click="cityF = c.id">{{ c.name }}</button>
      </div>
      <div class="chips">
        <button v-for="c in cats" :key="c.id" class="chip" :class="{ active: catF === c.id }" @click="catF = c.id"><Icon v-if="c.icon" :name="c.icon" />{{ c.label }}</button>
      </div>
    </div>
    <Transition name="slideup">
      <div v-if="selected" class="sheet card" @click="router.push({ name: 'place', params: { id: selected.id } })">
        <div class="si" :style="{ background: colors[selected.cat] }"><Icon name="pin" :size="18" /></div>
        <div class="st">
          <b>{{ selected.name }}</b>
          <span>{{ selected.blurb }}</span>
          <span v-if="selected.stop" class="stop">{{ selected.stop }}</span>
        </div>
        <Icon name="chevron" :size="18" class="chev" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mapwrap { position: relative; height: calc(100dvh - 58px - var(--sat)); }
.map { position: absolute; inset: 0; background: var(--paper); }
.map :deep(.leaflet-tile-pane) { filter: var(--map-filter); }
.map :deep(.pin) { width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: var(--c); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.3); display: grid; place-items: center; }
.map :deep(.pin.done) { opacity: .45; }
.map :deep(.pin > span) { transform: rotate(45deg); color: #fff; font-size: 11px; font-weight: 700; line-height: 1; }
.map :deep(.pin.base) { border-radius: 50%; transform: none; background: var(--ink); border-color: var(--paper); width: 30px; height: 30px; }
.map :deep(.pin.base > span) { transform: none; color: var(--paper); font-size: 15px; }
.map :deep(.leaflet-tooltip) { background: var(--card); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; font-family: inherit; font-weight: 600; font-size: 12px; box-shadow: var(--shadow-1); }
.map :deep(.leaflet-tooltip-top::before) { border-top-color: var(--card); }
.map :deep(.leaflet-control-zoom a) { background: var(--card); color: var(--ink); border-color: var(--line); }
.map :deep(.leaflet-control-attribution) { background: var(--glass); color: var(--ink-3); font-size: 9px; font-family: inherit; }
.map :deep(.leaflet-control-attribution a) { color: var(--ink-2); }
.map :deep(.leaflet-bottom) { bottom: calc(var(--tabbar) + var(--sab) + 12px); }
.top { position: absolute; top: 10px; left: 0; right: 0; z-index: 500; padding: 0 var(--gutter); pointer-events: none; }
.top > * { pointer-events: auto; }
.seg { display: inline-flex; background: var(--glass-strong); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: var(--r-pill); padding: 3px; gap: 2px; border: 1px solid var(--line); box-shadow: var(--shadow-1); margin-bottom: 8px; }
.seg button { padding: 7px 14px; border-radius: var(--r-pill); font-size: 0.8125rem; font-weight: 600; color: var(--ink-2); }
.seg button.active { background: var(--ink); color: var(--paper); }
.chips { margin: 0; padding: 0; }
.chip { background: var(--glass-strong); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: var(--shadow-1); }
.chip.active { background: var(--ink); color: var(--paper); }
.sheet { position: absolute; left: var(--gutter); right: var(--gutter); bottom: calc(var(--tabbar) + var(--sab) + 20px); z-index: 500; display: flex; gap: 12px; align-items: center; padding: 12px 14px; cursor: pointer; box-shadow: var(--shadow-2); }
.si { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: #fff; flex: none; }
.st { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.st b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st span { font-size: 0.75rem; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st .stop { color: var(--ember); font-weight: 500; }
.chev { color: var(--ink-3); }
.slideup-enter-active, .slideup-leave-active { transition: all .3s var(--ease); }
.slideup-enter-from, .slideup-leave-to { opacity: 0; transform: translateY(16px); }
</style>
