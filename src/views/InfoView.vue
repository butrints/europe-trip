<script setup lang="ts">
import { computed } from 'vue';
import { useTrip } from '@/composables/useTrip';
import { useChecklist } from '@/composables/useStore';
import { fmtRange } from '@/composables/useNow';
import Icon from '@/components/ui/Icon.vue';

const { trip } = useTrip();
const t = trip.value;
const packed = useChecklist(`${t.slug}:packed`);
const packedCount = computed(() => t.info.packing.filter((p) => packed.has(p)).length);
const mapsHref = computed(() => `https://www.google.com/maps/search/?api=1&query=${t.base.pos.lat},${t.base.pos.lng}`);
</script>

<template>
  <main class="page">
    <header class="ph">
      <p class="eyebrow">{{ fmtRange(t.start, t.end) }} · {{ t.travellers.join(' & ') }}</p>
      <h1 class="display">Info</h1>
    </header>

    <!-- Stay -->
    <section class="block">
      <div class="section-head"><h2>Stay</h2></div>
      <div class="card stay">
        <div class="si"><Icon name="home" /></div>
        <div class="st">
          <b>{{ t.base.name }}</b>
          <span v-if="t.base.address">{{ t.base.address }}</span>
          <span v-if="t.base.checkin || t.base.checkout" class="num">Check-in {{ t.base.checkin ?? '—' }} · out {{ t.base.checkout ?? '—' }}</span>
          <span v-if="t.base.note" class="note">{{ t.base.note }}</span>
          <span v-if="!t.base.confirmed" class="tag gold">address pending · distances off</span>
        </div>
        <div class="sa">
          <a v-if="t.base.url" class="btn btn-tonal btn-sm" :href="t.base.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />Booking</a>
          <a v-if="t.base.confirmed" class="btn btn-tonal btn-sm" :href="mapsHref" target="_blank" rel="noopener"><Icon name="map" :size="14" />Map</a>
        </div>
      </div>
    </section>

    <!-- Facts -->
    <section class="block">
      <div class="section-head"><h2>Good to know</h2></div>
      <div class="card list">
        <div v-for="f in t.info.facts" :key="f.label" class="row"><span class="k">{{ f.label }}</span><span class="v">{{ f.value }}</span></div>
      </div>
    </section>

    <!-- Packing -->
    <section class="block">
      <div class="section-head"><h2>Packing</h2><span class="faint small num">{{ packedCount }}/{{ t.info.packing.length }}</span></div>
      <div class="card list pack">
        <button v-for="p in t.info.packing" :key="p" class="row tap" :class="{ on: packed.has(p) }" @click="packed.toggle(p)">
          <span class="chk"><Icon name="check" :size="13" /></span><span class="k">{{ p }}</span>
        </button>
      </div>
    </section>

    <!-- Apps -->
    <section class="block">
      <div class="section-head"><h2>Install before you go</h2></div>
      <div class="card list">
        <a v-for="a in t.info.apps" :key="a.name" class="row tap" :href="a.url" target="_blank" rel="noopener">
          <span class="ai"><Icon name="grid" :size="16" /></span>
          <span class="kv"><b>{{ a.name }}</b><span>{{ a.why }}</span></span>
          <Icon name="external" :size="14" class="chev" />
        </a>
      </div>
    </section>

    <!-- Phrases -->
    <section class="block">
      <div class="section-head"><h2>Een beetje Nederlands</h2></div>
      <div class="phrases">
        <div v-for="p in t.info.phrases" :key="p.nl" class="card ph2">
          <b>{{ p.nl }}</b>
          <span>{{ p.en }}</span>
          <em>{{ p.say }}</em>
        </div>
      </div>
    </section>

    <!-- Emergency -->
    <section class="block">
      <div class="section-head"><h2>If something goes wrong</h2></div>
      <div class="card list">
        <a v-for="e in t.info.emergency" :key="e.label" class="row tap" :href="e.url ?? `tel:${e.value.replace(/\s/g, '')}`">
          <span class="ai red"><Icon name="phone" :size="16" /></span>
          <span class="kv"><b>{{ e.label }}</b><span>{{ e.value }}</span></span>
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.ph { padding: 24px 0 8px; }
.ph h1 { font-size: 2.25rem; }
.block { margin-top: 24px; }
.small { font-size: 0.8125rem; }
.stay { display: flex; gap: 12px; padding: 14px; align-items: flex-start; flex-wrap: wrap; }
.si { width: 40px; height: 40px; border-radius: 12px; background: var(--ember-soft); color: var(--ember); display: grid; place-items: center; flex: none; }
.st { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
.st b { font-weight: 600; }
.st span { font-size: 0.8125rem; color: var(--ink-2); }
.st .note { color: var(--ink); }
.st .tag { align-self: flex-start; margin-top: 4px; }
.sa { display: flex; gap: 6px; width: 100%; }
.list { padding: 4px 0; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; min-height: 50px; width: 100%; text-align: left; color: var(--ink); font-size: 0.9375rem; }
.row + .row { border-top: 1px solid var(--line); }
.row .k { flex: 1; }
.row .v { color: var(--ink-2); font-size: 0.875rem; text-align: right; max-width: 60%; }
.row.tap:active { background: var(--paper-2); }
.chk { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--line-2); display: grid; place-items: center; color: transparent; flex: none; transition: all .2s var(--ease-spring); }
.row.on .chk { background: var(--pine); border-color: var(--pine); color: #fff; }
.row.on .k { color: var(--ink-3); text-decoration: line-through; }
.ai { width: 32px; height: 32px; border-radius: 10px; background: var(--paper-2); display: grid; place-items: center; color: var(--ink-2); flex: none; }
:root[data-theme="dark"] .ai { background: var(--card-2); }
.ai.red { background: var(--ember-soft); color: var(--ember); }
.kv { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.kv b { font-weight: 600; font-size: 0.9375rem; }
.kv span { font-size: 0.8125rem; color: var(--ink-2); }
.chev { color: var(--ink-3); }
.phrases { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ph2 { padding: 12px; display: flex; flex-direction: column; }
.ph2 b { font-weight: 600; font-size: 0.9375rem; }
.ph2 span { font-size: 0.75rem; color: var(--ink-2); margin-top: 2px; }
.ph2 em { font-style: normal; font-size: 0.6875rem; color: var(--ember); margin-top: 4px; }
</style>
