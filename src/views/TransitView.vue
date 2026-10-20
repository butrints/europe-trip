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
      <h1 class="h1">Transit</h1>
    </header>

    <section v-if="boards.length" class="block">
      <div class="chips sel">
        <button v-for="b in boards" :key="b.id" class="chip" :class="{ on: board === b.id }" @click="board = b.id">{{ b.title }}</button>
      </div>
      <LiveBoard v-if="current" :key="current.id" :from="current.from" :to="current.to" />
    </section>

    <section v-if="keyRoutes.length">
      <div class="sec-head"><span class="dot" /><span>Key journeys</span><span class="count">{{ keyRoutes.length }}</span></div>
      <div class="stack">
        <button v-for="r in keyRoutes" :key="r.id" class="kr card" @click="openRoute(r.id)">
          <div class="legs">
            <LineBadge v-for="(s, i) in r.steps.filter(x => x.mode !== 'walk')" :key="i" :mode="s.mode" :line="s.line" :operator="s.operator" />
          </div>
          <div class="kt"><b>{{ r.from }} → {{ r.to }}</b><span class="num">{{ r.total }}<template v-if="r.cost"> · {{ r.cost }}</template></span></div>
          <Icon name="chevron" :size="18" class="chev" />
        </button>
      </div>
    </section>

    <section>
      <div class="sec-head"><span class="dot" /><span>How tickets work</span></div>
      <div class="stack">
        <article v-for="op in t.operators" :key="op.id" class="op card pad">
          <div class="oh">
            <div class="ico-tile lg solid logo" :style="{ '--k': op.color, color: op.ink ?? '#fff' }">{{ op.abbr }}</div>
            <div class="ot"><b>{{ op.name }}</b><span>{{ op.region }}</span></div>
          </div>
          <ol class="how">
            <li v-for="(h, i) in op.how" :key="i"><i>{{ i + 1 }}</i><span>{{ h }}</span></li>
          </ol>
          <div class="fares">
            <div v-for="f in op.fares" :key="f.label" class="fare"><b class="num">{{ f.price }}</b><span>{{ f.label }}</span></div>
          </div>
          <ul v-if="op.tips?.length" class="tips">
            <li v-for="(x, i) in op.tips" :key="i"><Icon name="sparkle" :size="14" />{{ x }}</li>
          </ul>
          <div class="links">
            <a v-for="l in op.links" :key="l.url" class="btn btn-tonal btn-sm" :href="l.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />{{ l.label }}</a>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.ph { padding: 8px 0 0; display: grid; gap: 6px; }
.block { margin-top: 20px; display: grid; gap: 12px; }
.stack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.kr { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px; text-align: left; color: var(--fg); }
.legs { display: flex; gap: 4px; flex: none; }
.kt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.kt b { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kt span { font-size: 13px; color: var(--fg-2); }
.chev { color: var(--fg-3); }
.op { display: grid; gap: 14px; }
.oh { display: flex; align-items: center; gap: 12px; }
.logo { font-weight: 800; font-size: 12px; letter-spacing: -.02em; }
.ot { display: flex; flex-direction: column; min-width: 0; }
.ot b { font-weight: 700; font-size: 15px; }
.ot span { font-size: 13px; color: var(--fg-2); }
.how { display: grid; gap: 8px; }
.how li { display: flex; gap: 10px; font-size: 14px; line-height: 1.45; }
.how li i { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--sec-soft); color: var(--sec); font-style: normal; font-size: 11px; font-weight: 800; display: grid; place-items: center; margin-top: 1px; }
.fares { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
.fare { padding: 10px 12px; border-radius: var(--r-md); background: var(--bg-2); }
.fare b { display: block; font-size: 17px; font-weight: 800; letter-spacing: -.01em; }
.fare span { font-size: 11px; color: var(--fg-2); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.tips { display: grid; gap: 4px; font-size: 13px; color: var(--fg-2); }
.tips li { display: flex; gap: 6px; align-items: flex-start; line-height: 1.45; }
.tips li .ic { color: var(--sec); margin-top: 2px; }
.links { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
