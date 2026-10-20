<script setup lang="ts">
import { computed } from 'vue';
import { useWeather, wxIcon, wxLabel } from '@/composables/useWeather';
import type { City } from '@/types/trip';

const props = defineProps<{ city: City; start: string; end: string; today: string }>();
const { days, loading, error } = useWeather(props.city.pos, props.city.tz);
const inTrip = computed(() => days.value.filter((d) => d.date >= props.start && d.date <= props.end));
const shown = computed(() => (inTrip.value.length ? inTrip.value : days.value.slice(0, 7)));
const forTrip = computed(() => inTrip.value.length > 0);
const fmt = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' });
</script>

<template>
  <section class="wxs card pad">
    <div class="wh">
      <h3>{{ city.name }}</h3>
      <span class="st">{{ loading ? 'Loading…' : forTrip ? 'Trip forecast' : 'Live forecast · trip dates appear 16 days out' }}</span>
    </div>
    <p v-if="error" class="st">Weather offline ({{ error }})</p>
    <div v-else class="wx">
      <div v-for="d in shown" :key="d.date" class="d" :class="{ today: d.date === today }" :title="wxLabel(d.code)">
        <span class="dn">{{ fmt(d.date) }}</span>
        <span class="ico" aria-hidden="true">{{ wxIcon(d.code) }}</span>
        <span class="t num">{{ d.tmax }}°<i>/{{ d.tmin }}°</i></span>
        <span class="r num" :class="{ hi: d.rain >= 50 }">{{ d.rain }}% 💧</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wxs { display: grid; gap: 12px; min-width: 0; }
.wh { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.wh h3 { font-size: 15px; font-weight: 700; color: var(--fg); }
.st { font-size: 12px; color: var(--fg-3); }
.wx { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
.wx::-webkit-scrollbar { display: none; }
.d {
  flex: none; width: 72px; padding: 10px 4px; border-radius: var(--r-md); background: var(--card-2);
  display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;
}
.d.today { box-shadow: inset 0 0 0 2px var(--sec); }
.dn { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-2); }
.ico { font-size: 24px; line-height: 1.2; }
.t { font-size: 15px; font-weight: 700; color: var(--fg); font-variant-numeric: tabular-nums; }
.t i { font-style: normal; color: var(--fg-3); }
.r { font-size: 11px; color: var(--fg-3); font-variant-numeric: tabular-nums; }
.r.hi { color: var(--k-sight); font-weight: 700; }
</style>
