<script setup lang="ts">
import { computed } from 'vue';
import { useTrip } from '@/composables/useTrip';
import { useChecklist } from '@/composables/useStore';
import { fmtRange } from '@/composables/useNow';
import Icon from '@/components/ui/Icon.vue';
import SyncCard from '@/components/SyncCard.vue';

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
      <h1 class="h1">Info</h1>
    </header>

    <!-- Sync -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Sync</span></div>
      <SyncCard :slug="t.slug" />
    </section>

    <!-- Stay -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Stay</span></div>
      <div class="card pad stay">
        <div class="ico-tile solid" style="--k: var(--sec)"><Icon name="home" /></div>
        <div class="st">
          <b>{{ t.base.name }}</b>
          <span v-if="t.base.address">{{ t.base.address }}</span>
          <span v-if="t.base.checkin || t.base.checkout" class="num">Check-in {{ t.base.checkin ?? '—' }} · out {{ t.base.checkout ?? '—' }}</span>
          <span v-if="t.base.note" class="note">{{ t.base.note }}</span>
          <span v-if="!t.base.confirmed" class="tag" style="--tag: var(--k-food); --tag-soft: var(--k-food-soft)">address pending · distances off</span>
        </div>
        <div class="sa">
          <a v-if="t.base.url" class="btn btn-tonal btn-sm" :href="t.base.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />Booking</a>
          <a v-if="t.base.confirmed" class="btn btn-tonal btn-sm" :href="mapsHref" target="_blank" rel="noopener"><Icon name="map" :size="14" />Map</a>
        </div>
      </div>
    </section>

    <!-- Facts -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Good to know</span></div>
      <div class="card list">
        <div v-for="f in t.info.facts" :key="f.label" class="row"><span class="k">{{ f.label }}</span><span class="v">{{ f.value }}</span></div>
      </div>
    </section>

    <!-- Packing -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Packing</span><span class="count">{{ packedCount }}/{{ t.info.packing.length }}</span></div>
      <div class="card list">
        <button v-for="p in t.info.packing" :key="p" class="row" :class="{ on: packed.has(p) }" @click="packed.toggle(p)">
          <span class="check" :class="{ on: packed.has(p) }"><Icon name="check" /></span><span class="k">{{ p }}</span>
        </button>
      </div>
    </section>

    <!-- Apps -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Install before you go</span></div>
      <div class="card list">
        <a v-for="a in t.info.apps" :key="a.name" class="row" :href="a.url" target="_blank" rel="noopener">
          <span class="ai"><Icon name="grid" :size="16" /></span>
          <span class="kv"><b>{{ a.name }}</b><span>{{ a.why }}</span></span>
          <Icon name="external" :size="14" class="chev" />
        </a>
      </div>
    </section>

    <!-- Phrases -->
    <section>
      <div class="sec-head"><span class="dot" /><span>Een beetje Nederlands</span></div>
      <div class="phrases">
        <div v-for="p in t.info.phrases" :key="p.nl" class="card pad phr">
          <b>{{ p.nl }}</b>
          <span>{{ p.en }}</span>
          <em>{{ p.say }}</em>
        </div>
      </div>
    </section>

    <!-- Emergency -->
    <section>
      <div class="sec-head"><span class="dot" /><span>If something goes wrong</span></div>
      <div class="card list">
        <a v-for="e in t.info.emergency" :key="e.label" class="row" :href="e.url ?? `tel:${e.value.replace(/\s/g, '')}`">
          <span class="ico-tile" style="--k: var(--k-home); --k-soft: var(--k-home-soft)"><Icon name="phone" :size="18" /></span>
          <span class="kv"><b>{{ e.label }}</b><span>{{ e.value }}</span></span>
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.ph { padding: 8px 0 0; display: grid; gap: 6px; }
.stay { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.st { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
.st b { font-weight: 700; font-size: 15px; }
.st span { font-size: 13px; color: var(--fg-2); }
.st .note { color: var(--fg); }
.st .tag { align-self: flex-start; margin-top: 4px; font-size: 11px; color: var(--tag); }
.sa { display: flex; gap: 8px; width: 100%; }
.list { overflow: hidden; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; min-height: 50px; width: 100%; text-align: left; color: var(--fg); font-size: 15px; }
.row + .row { border-top: 1px solid var(--line); }
.row .k { flex: 1; color: var(--fg); }
.row .v { color: var(--fg-2); font-size: 14px; text-align: right; max-width: 60%; }
button.row:active, a.row:active { background: var(--card-2); }
.row.on .k { color: var(--fg-3); text-decoration: line-through; }
.ai { width: 32px; height: 32px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; color: var(--fg-2); flex: none; }
.kv { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.kv b { font-weight: 600; font-size: 15px; color: var(--fg); }
.kv span { font-size: 13px; color: var(--fg-2); }
.chev { color: var(--fg-3); }
.phrases { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.phr { display: flex; flex-direction: column; gap: 2px; }
.phr b { font-weight: 700; font-size: 15px; }
.phr span { font-size: 13px; color: var(--fg-2); }
.phr em { font-style: normal; font-size: 12px; color: var(--sec); margin-top: 4px; }
</style>
