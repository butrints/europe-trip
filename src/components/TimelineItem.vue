<script setup lang="ts">
import { computed } from 'vue';
import type { DayItem, ItemKind } from '@/types/trip';
import { useTrip } from '@/composables/useTrip';
import { openRoute } from '@/composables/useSheet';
import Icon from '@/components/ui/Icon.vue';
import LineBadge from '@/components/ui/LineBadge.vue';

const props = defineProps<{ item: DayItem; done: boolean; isNow: boolean; isPast: boolean; compact?: boolean }>();
const emit = defineEmits<{ toggle: [] }>();
const { place, route } = useTrip();
const p = computed(() => place(props.item.placeId));
const r = computed(() => route(props.item.routeId));
const icon: Record<ItemKind, string> = { flight: 'plane', transit: 'train', sight: 'pin', food: 'food', xmas: 'gift', free: 'sparkle', home: 'home', shop: 'bag', note: 'info', view: 'eye' };
const kindToken: Record<ItemKind, string> = { flight: 'flight', transit: 'flight', sight: 'sight', view: 'view', food: 'food', xmas: 'xmas', free: 'free', home: 'home', shop: 'shop', note: 'note' };
const tagToken: Record<string, string> = { must: 'home', free: 'free', book: 'food', romantic: 'xmas', rainy: 'sight', evening: 'flight' };
const kindStyle = computed(() => {
  const k = kindToken[props.item.kind];
  return { '--k': `var(--k-${k})`, '--k-soft': `var(--k-${k}-soft)` };
});
const tagStyle = (t: string) => (tagToken[t] ? { '--tag': `var(--k-${tagToken[t]})`, '--tag-soft': `var(--k-${tagToken[t]}-soft)` } : undefined);
const rideLegs = computed(() => r.value?.steps.filter((x) => x.mode !== 'walk') ?? []);
</script>

<template>
  <article class="ti" :class="[item.kind, { done, now: isNow, past: isPast && !done, optional: item.optional, compact }]">
    <div v-if="!compact" class="time">
      <span v-if="item.time" class="num">{{ item.time }}</span>
      <span v-else class="dash">·</span>
      <small v-if="item.end" class="num">{{ item.end }}</small>
    </div>
    <div class="card body">
      <div class="top">
        <span class="ico-tile" :style="kindStyle"><Icon :name="icon[item.kind]" :size="18" /></span>
        <div class="tt">
          <h3>{{ item.title }}</h3>
          <p v-if="item.sub" class="sub">{{ item.sub }}</p>
        </div>
        <button class="check" :class="{ on: done }" :aria-label="done ? 'Mark not done' : 'Mark done'" @click.stop="emit('toggle')"><Icon name="check" :size="16" /></button>
      </div>
      <div v-if="!compact && item.notes?.length" class="notes">
        <p v-for="(n, i) in item.notes" :key="i">{{ n }}</p>
      </div>
      <div v-if="item.tags?.length || item.optional || p?.price" class="meta">
        <span v-if="item.optional" class="tag">optional</span>
        <span v-for="t in item.tags" :key="t" class="tag" :style="tagStyle(t)">{{ t }}</span>
        <span v-if="p?.price" class="price num">{{ p.price }}</span>
      </div>
      <button v-if="r" class="go" @click.stop="openRoute(r.id)">
        <span class="legs">
          <LineBadge v-for="(s, i) in rideLegs" :key="i" :mode="s.mode" :line="s.line" :operator="s.operator" />
          <Icon v-if="!rideLegs.length" name="walk" :size="18" />
        </span>
        <span class="gt">{{ rideLegs.length ? 'Route' : 'Walk' }} · <span class="num">{{ r.total }}</span></span>
        <Icon name="chevron" :size="16" />
      </button>
      <div v-if="p" class="foot">
        <RouterLink class="btn btn-tonal btn-sm" :to="{ name: 'place', params: { id: p.id } }"><Icon name="info" :size="16" />Details</RouterLink>
        <a v-if="p.book?.url" class="btn btn-soft btn-sm" :href="p.book.url" target="_blank" rel="noopener"><Icon name="ticket" :size="16" />{{ p.book.label ?? 'Book' }}</a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ti { display: grid; grid-template-columns: 54px 1fr; gap: 10px; }
.ti.compact { grid-template-columns: 1fr; }
.time { padding-top: 18px; text-align: right; font-size: 15px; font-weight: 700; color: var(--fg-2); line-height: 1; font-variant-numeric: tabular-nums; }
.time small { display: block; font-size: 11px; font-weight: 500; color: var(--fg-3); margin-top: 5px; }
.time .dash { color: var(--fg-3); }
.ti.now .time { color: var(--sec); }

.body { padding: 16px; display: grid; gap: 10px; min-width: 0; transition: opacity .2s, border-color .2s, box-shadow .2s; }
.ti.compact .body { padding: 12px; }
.ti.now .body { border-color: var(--sec); box-shadow: 0 0 0 3px var(--sec-soft); }
.ti.done .body { opacity: .55; }
.ti.done h3 { text-decoration: line-through; }
.ti.optional .body { border-style: dashed; background: transparent; }

.top { display: flex; align-items: flex-start; gap: 12px; }
.tt { flex: 1; min-width: 0; padding-top: 1px; }
h3 { font-size: 15px; font-weight: 700; line-height: 1.3; color: var(--fg); }
.sub { font-size: 13px; line-height: 1.4; color: var(--fg-2); margin-top: 2px; }

.notes { display: grid; gap: 6px; font-size: 14px; line-height: 1.45; color: var(--fg); }

.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.price { margin-left: auto; font-size: 13px; font-weight: 600; color: var(--fg-2); }

.go {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 8px 12px;
  border-radius: var(--r-md); background: var(--sec-soft); color: var(--sec); text-align: left;
  transition: transform .2s var(--ease);
}
.go:active { transform: scale(.98); }
.legs { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.gt { flex: 1; font-size: 13px; font-weight: 600; }

.foot { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
