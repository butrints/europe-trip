<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTrip } from '@/composables/useTrip';
import { openRoute } from '@/composables/useSheet';
import Icon from '@/components/ui/Icon.vue';
import LineBadge from '@/components/ui/LineBadge.vue';
import LiveBoard from '@/components/LiveBoard.vue';

const { trip } = useTrip();
const t = trip.value;
const boards = t.live ?? [];
const board = ref(boards[0]?.id ?? '');
const current = computed(() => boards.find((b) => b.id === board.value));
const keyRoutes = computed(() => t.routes.filter((r) => r.id.startsWith('key-') || r.id.startsWith('alt-')));
</script>

<template>
  <main class="page">
    <header class="ph">
      <p class="eyebrow">Tickets · lines · live boards</p>
      <h1 class="display">Transit</h1>
    </header>

    <section v-if="boards.length" class="block">
      <div class="seg">
        <button v-for="b in boards" :key="b.id" :class="{ active: board === b.id }" @click="board = b.id">{{ b.title }}</button>
      </div>
      <LiveBoard v-if="current" :key="current.id" :from="current.from" :to="current.to" />
    </section>

    <section v-if="keyRoutes.length" class="block">
      <div class="section-head"><h2>Key journeys</h2></div>
      <button v-for="r in keyRoutes" :key="r.id" class="kr card tap" @click="openRoute(r.id)">
        <div class="legs">
          <LineBadge v-for="(s, i) in r.steps.filter(x => x.mode !== 'walk')" :key="i" :mode="s.mode" :line="s.line" :operator="s.operator" />
        </div>
        <div class="kt"><b>{{ r.from }} → {{ r.to }}</b><span class="num">{{ r.total }}<template v-if="r.cost"> · {{ r.cost }}</template></span></div>
        <Icon name="chevron" :size="18" class="chev" />
      </button>
    </section>

    <section class="block">
      <div class="section-head"><h2>How tickets work</h2></div>
      <article v-for="op in t.operators" :key="op.id" class="op card">
        <div class="oh">
          <div class="logo" :style="{ background: op.color, color: op.ink ?? '#fff' }">{{ op.abbr }}</div>
          <div class="ot"><b>{{ op.name }}</b><span>{{ op.region }}</span></div>
        </div>
        <ol class="how">
          <li v-for="(h, i) in op.how" :key="i"><i>{{ i + 1 }}</i><span>{{ h }}</span></li>
        </ol>
        <div class="fares">
          <div v-for="f in op.fares" :key="f.label" class="fare"><b class="num">{{ f.price }}</b><span>{{ f.label }}</span></div>
        </div>
        <ul v-if="op.tips?.length" class="tips">
          <li v-for="(x, i) in op.tips" :key="i"><Icon name="sparkle" :size="13" />{{ x }}</li>
        </ul>
        <div class="links">
          <a v-for="l in op.links" :key="l.url" class="btn btn-tonal btn-sm" :href="l.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />{{ l.label }}</a>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.ph { padding: 24px 0 8px; }
.ph h1 { font-size: 2.25rem; }
.block { margin-top: 20px; }
.seg { display: inline-flex; background: var(--paper-2); border-radius: var(--r-pill); padding: 3px; gap: 2px; margin-bottom: 10px; max-width: 100%; overflow-x: auto; scrollbar-width: none; }
:root[data-theme="dark"] .seg { background: var(--card-2); }
.seg button { padding: 7px 14px; border-radius: var(--r-pill); font-size: 0.8125rem; font-weight: 600; color: var(--ink-2); white-space: nowrap; transition: all .2s var(--ease); }
.seg button.active { background: var(--card); color: var(--ink); box-shadow: var(--shadow-1); }
.kr { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; text-align: left; color: var(--ink); }
.kr + .kr { margin-top: 8px; }
.legs { display: flex; gap: 4px; flex: none; }
.kt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.kt b { font-weight: 600; font-size: 0.9375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kt span { font-size: 0.75rem; color: var(--ink-2); }
.chev { color: var(--ink-3); }
.op { padding: 16px; }
.op + .op { margin-top: 12px; }
.oh { display: flex; align-items: center; gap: 12px; }
.logo { width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; font-weight: 800; font-size: 0.75rem; letter-spacing: -0.02em; flex: none; }
.ot { display: flex; flex-direction: column; min-width: 0; }
.ot b { font-weight: 600; }
.ot span { font-size: 0.8125rem; color: var(--ink-2); }
.how { margin-top: 14px; }
.how li { display: flex; gap: 10px; font-size: 0.875rem; line-height: 1.45; }
.how li + li { margin-top: 8px; }
.how li i { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--paper-2); font-style: normal; font-size: 0.6875rem; font-weight: 700; display: grid; place-items: center; margin-top: 1px; }
:root[data-theme="dark"] .how li i { background: var(--card-2); }
.fares { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 14px; }
.fare { padding: 10px 12px; border-radius: var(--r-md); background: var(--paper-2); }
:root[data-theme="dark"] .fare { background: var(--card-2); }
.fare b { display: block; font-size: 1.0625rem; font-weight: 700; letter-spacing: -0.02em; }
.fare span { font-size: 0.625rem; color: var(--ink-2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.tips { margin-top: 12px; font-size: 0.8125rem; color: var(--ink-2); }
.tips li { display: flex; gap: 6px; align-items: flex-start; line-height: 1.45; }
.tips li .ic { color: var(--ember); margin-top: 3px; }
.tips li + li { margin-top: 4px; }
.links { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
</style>
