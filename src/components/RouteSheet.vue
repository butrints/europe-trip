<script setup lang="ts">
import { computed } from 'vue';
import { useTrip, navLinks } from '@/composables/useTrip';
import Sheet from '@/components/ui/Sheet.vue';
import Icon from '@/components/ui/Icon.vue';
import LineBadge from '@/components/ui/LineBadge.vue';
import type { StepMode } from '@/types/trip';

const props = defineProps<{ routeId: string | null }>();
const emit = defineEmits<{ close: [] }>();
const { route } = useTrip();
const r = computed(() => route(props.routeId ?? undefined));
const links = computed(() => (r.value?.dest ? navLinks(r.value.origin, r.value.dest, r.value.to) : null));
const modeIcon: Record<StepMode, string> = { walk: 'walk', tram: 'tram', bus: 'bus', train: 'train', metro: 'metro', ferry: 'ferry', plane: 'plane', taxi: 'nav' };
</script>

<template>
  <Sheet :open="!!r" eyebrow="How to get there" :title="r ? r.to : ''" :sub="r ? `from ${r.from}` : ''" @close="emit('close')">
    <template v-if="r">
      <div class="sum">
        <div class="legs">
          <template v-for="(s, i) in r.steps" :key="i">
            <LineBadge :mode="s.mode" :line="s.mode === 'walk' ? undefined : s.line" :operator="s.operator" />
            <Icon v-if="i < r.steps.length - 1" name="chevron" :size="14" class="sep" />
          </template>
        </div>
        <div class="tot">
          <b class="num">{{ r.total }}</b>
          <span v-if="r.cost" class="num">{{ r.cost }}</span>
        </div>
      </div>

      <ol class="steps">
        <li v-for="(s, i) in r.steps" :key="i" class="step" :class="s.mode">
          <div class="si"><Icon :name="modeIcon[s.mode]" /></div>
          <div class="sc">
            <div class="st">
              <template v-if="s.mode === 'walk'">Walk<span v-if="s.to" class="dir">to {{ s.to }}</span></template>
              <template v-else>
                <LineBadge :mode="s.mode" :line="s.line" :operator="s.operator" />
                <span v-if="s.direction" class="dir">→ {{ s.direction }}</span>
              </template>
              <span class="dur num">{{ s.dur }}</span>
            </div>
            <p v-if="s.note" class="sd">{{ s.note }}</p>
            <div v-if="s.mode !== 'walk' && (s.from || s.stops?.length || s.to)" class="stops">
              <div v-if="s.from" class="key"><b>{{ s.from }}</b><span>board</span></div>
              <div v-for="(st, j) in s.stops" :key="j"><span class="n">{{ st }}</span></div>
              <div v-if="s.to" class="key"><b>{{ s.to }}</b><span>get off</span></div>
            </div>
            <div v-if="s.ticket" class="tk"><Icon name="ticket" :size="16" /><span>{{ s.ticket }}</span></div>
            <div v-if="s.warn" class="warn"><Icon name="warn" :size="16" /><span>{{ s.warn }}</span></div>
          </div>
        </li>
      </ol>

      <div v-if="links" class="apps">
        <a :href="links.google" target="_blank" rel="noopener"><Icon name="nav" />Google Maps</a>
        <a :href="links.apple" target="_blank" rel="noopener"><Icon name="map" />Apple Maps</a>
        <a :href="links.citymapper" target="_blank" rel="noopener"><Icon name="compass" />Citymapper</a>
      </div>

      <div v-if="r.alternatives?.length" class="alt">
        <p class="eyebrow">Alternatives</p>
        <div v-for="a in r.alternatives" :key="a.title" class="card ac">
          <b>{{ a.title }}</b>
          <p>{{ a.detail }}</p>
        </div>
      </div>
    </template>
  </Sheet>
</template>

<style scoped>
.sum { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); }
.legs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; flex: 1; }
.sep { color: var(--ink-3); }
.tot { text-align: right; }
.tot b { display: block; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
.tot span { font-size: 0.75rem; color: var(--ink-2); font-weight: 600; }
.steps { margin-top: 18px; }
.step { display: grid; grid-template-columns: 40px 1fr; gap: 14px; position: relative; padding-bottom: 20px; }
.step::before { content: ''; position: absolute; left: 18px; top: 42px; bottom: -2px; width: 4px; border-radius: 2px; background: var(--line-2); }
.step.walk::before { background: repeating-linear-gradient(to bottom, var(--line-2) 0 6px, transparent 6px 12px); }
.step.tram::before { background: var(--delijn); }
.step.bus::before { background: #3A6EA5; }
.step.train::before { background: var(--nmbs); }
.step.metro::before { background: var(--gvb); }
.step.ferry::before { background: #1B9AAA; }
.step.plane::before { background: #4B4F5B; }
.step:last-child { padding-bottom: 0; }
.step:last-child::before { display: none; }
.si { width: 40px; height: 40px; border-radius: 50%; background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; color: var(--ink); box-shadow: var(--shadow-1); position: relative; z-index: 1; }
.step.tram .si { background: var(--delijn); color: var(--delijn-ink); border-color: transparent; }
.step.bus .si { background: #3A6EA5; color: #fff; border-color: transparent; }
.step.train .si { background: var(--nmbs); color: #fff; border-color: transparent; }
.step.metro .si { background: var(--gvb); color: #fff; border-color: transparent; }
.step.ferry .si { background: #1B9AAA; color: #fff; border-color: transparent; }
.step.plane .si { background: #4B4F5B; color: #fff; border-color: transparent; }
.sc { padding-top: 8px; min-width: 0; }
.st { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 600; font-size: 0.9375rem; }
.st .dir { font-weight: 500; color: var(--ink-2); font-size: 0.875rem; }
.st .dur { margin-left: auto; font-size: 0.8125rem; color: var(--ink-2); font-weight: 600; }
.sd { font-size: 0.8125rem; color: var(--ink-2); margin-top: 3px; line-height: 1.45; }
.stops { margin-top: 10px; font-size: 0.8125rem; }
.stops div { display: flex; gap: 10px; align-items: baseline; padding: 3px 0; }
.stops div::before { content: ''; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--ink-3); flex: none; position: relative; top: 1px; }
.stops div.key::before { border-color: var(--ink); background: var(--ink); }
.stops .n { color: var(--ink-2); }
.stops div span:not(.n) { color: var(--ink-3); margin-left: auto; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.tk { margin-top: 10px; padding: 9px 11px; border-radius: var(--r-sm); background: var(--sky-soft); color: var(--sky); font-size: 0.8125rem; display: flex; gap: 8px; align-items: flex-start; line-height: 1.4; }
.tk .ic { margin-top: 2px; }
.warn { margin-top: 8px; padding: 9px 11px; border-radius: var(--r-sm); background: var(--gold-soft); color: #946A05; font-size: 0.8125rem; display: flex; gap: 8px; align-items: flex-start; line-height: 1.4; }
:root[data-theme="dark"] .warn { color: var(--gold); }
.apps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 20px; }
.apps a { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); color: var(--ink); font-size: 0.75rem; font-weight: 600; transition: transform .15s var(--ease); }
.apps a:active { transform: scale(0.95); }
.apps a .ic { color: var(--ember); }
.alt { margin-top: 20px; }
.alt .eyebrow { margin-bottom: 8px; }
.ac { padding: 12px 14px; font-size: 0.875rem; }
.ac + .ac { margin-top: 8px; }
.ac b { display: block; font-weight: 600; }
.ac p { color: var(--ink-2); margin-top: 2px; line-height: 1.45; }
</style>
