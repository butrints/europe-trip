<script setup lang="ts">
import type { Place, PlaceCategory } from '@/types/trip';
import Icon from '@/components/ui/Icon.vue';
import SmartImg from '@/components/ui/SmartImg.vue';

defineProps<{ place: Place; visited?: boolean; picked?: boolean; distance?: string }>();
const catIcon: Record<PlaceCategory, string> = { sight: 'pin', view: 'eye', museum: 'museum', food: 'food', cafe: 'coffee', bar: 'coffee', market: 'bag', xmas: 'gift', shop: 'bag', park: 'tree', station: 'train', stay: 'home' };
const catLabel: Record<PlaceCategory, string> = { sight: 'Sight', view: 'Viewpoint', museum: 'Museum', food: 'Food', cafe: 'Café', bar: 'Bar', market: 'Market', xmas: 'Christmas', shop: 'Shopping', park: 'Park', station: 'Station', stay: 'Stay' };
const catKind: Record<PlaceCategory, string> = { sight: 'sight', view: 'view', museum: 'sight', food: 'food', cafe: 'food', bar: 'food', market: 'food', xmas: 'xmas', shop: 'shop', park: 'free', station: 'transit', stay: 'home' };
const kindVars = (c: PlaceCategory) => ({ '--k': `var(--k-${catKind[c]})`, '--k-soft': `var(--k-${catKind[c]}-soft)` });
/** Nearest stop name only: cut at the first " · " (lines), then at 24 chars. */
const stopShort = (s?: string) => {
  if (!s) return '—';
  const head = s.split(' · ')[0];
  return head.length > 24 ? `${head.slice(0, 23).trimEnd()}…` : head;
};
</script>

<template>
  <RouterLink class="pc card" :class="{ visited }" :style="kindVars(place.cat)" :to="{ name: 'place', params: { id: place.id } }">
    <div class="photo">
      <SmartImg :src="place.img" :alt="place.name"><span class="fb"><Icon :name="catIcon[place.cat]" :size="28" /></span></SmartImg>
      <div class="ov-l">
        <span class="tag solid">{{ catLabel[place.cat] }}</span>
        <span v-if="place.rating === 3" class="tag must">★ Must</span>
      </div>
      <span v-if="visited" class="dot vis" aria-label="Visited"><Icon name="check" :size="12" /></span>
      <span v-else-if="picked" class="dot pk" aria-label="Added to a day"><Icon name="calendar" :size="12" /></span>
    </div>
    <div class="body">
      <h3 class="t">{{ place.name }}<span v-if="distance" class="d"> · {{ distance }}</span></h3>
      <p class="blurb">{{ place.blurb }}</p>
      <div class="facts">
        <div class="fact"><span class="k"><Icon name="euro" :size="14" />Price</span><span class="v">{{ place.price || '—' }}</span></div>
        <div class="fact"><span class="k"><Icon name="clock" :size="14" />Time</span><span class="v">{{ place.duration || '—' }}</span></div>
        <div class="fact"><span class="k"><Icon name="tram" :size="14" />Stop</span><span class="v">{{ stopShort(place.stop) }}</span></div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.pc { display: flex; flex-direction: column; overflow: hidden; color: var(--fg); text-decoration: none; transition: transform .15s, opacity .2s; }
.pc:active { transform: scale(.985); }
.pc.visited { opacity: .6; }
.photo { position: relative; aspect-ratio: 16 / 10; }
.fb { position: absolute; inset: 0; display: grid; place-items: center; background: var(--k-soft); color: var(--k); }
.ov-l { position: absolute; left: 10px; top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.tag.solid { --tag: #fff; --tag-soft: var(--k); }
.tag.must { --tag: #fff; --tag-soft: var(--k-home); }
.dot { position: absolute; right: 10px; top: 10px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; }
.dot.vis { background: var(--k-free); color: #fff; }
.dot.pk { background: var(--fg); color: var(--card); }
.body { padding: 14px; display: grid; gap: 6px; min-width: 0; }
.t { font-size: 17px; font-weight: 700; line-height: 1.15; letter-spacing: -.01em; text-wrap: balance; }
.d { font-size: 12px; font-weight: 500; letter-spacing: 0; color: var(--fg-3); font-variant-numeric: tabular-nums; }
.blurb { font-size: 13px; line-height: 1.45; color: var(--fg-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
.facts .fact { min-width: 0; }
.facts .v { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
</style>
