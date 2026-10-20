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
      <div class="sum card pad">
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
            <div v-if="s.ticket" class="tk card tint" style="--tint: var(--k-sight-soft)"><Icon name="ticket" :size="16" /><span>{{ s.ticket }}</span></div>
            <div v-if="s.warn" class="warn card tint" style="--tint: var(--k-food-soft)"><Icon name="warn" :size="16" /><span>{{ s.warn }}</span></div>
          </div>
        </li>
      </ol>

      <div v-if="links" class="apps">
        <a class="card" :href="links.google" target="_blank" rel="noopener"><Icon name="nav" />Google Maps</a>
        <a class="card" :href="links.apple" target="_blank" rel="noopener"><Icon name="map" />Apple Maps</a>
        <a class="card" :href="links.citymapper" target="_blank" rel="noopener"><Icon name="compass" />Citymapper</a>
      </div>

      <div v-if="r.alternatives?.length" class="alt">
        <p class="eyebrow">Alternatives</p>
        <div v-for="a in r.alternatives" :key="a.title" class="card pad ac">
          <b>{{ a.title }}</b>
          <p>{{ a.detail }}</p>
        </div>
      </div>
    </template>
  </Sheet>
</template>

<style scoped>
.sum { display: flex; align-items: center; gap: 12px; }
.legs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; flex: 1; }
.sep { color: var(--fg-3); }
.tot { text-align: right; font-variant-numeric: tabular-nums; }
.tot b { display: block; font-size: 22px; font-weight: 800; letter-spacing: -.01em; line-height: 1.15; }
.tot span { display: block; margin-top: 2px; font-size: 13px; color: var(--fg-2); font-weight: 600; }
.steps { margin-top: 20px; }
.step { display: grid; grid-template-columns: 40px 1fr; gap: 14px; position: relative; padding-bottom: 20px; }
.step::before { content: ''; position: absolute; left: 18px; top: 42px; bottom: -2px; width: 4px; border-radius: 2px; background: var(--line-2); }
.step.walk::before { background: repeating-linear-gradient(to bottom, var(--line-2) 0 6px, transparent 6px 12px); }
.step.tram::before, .step.delijn::before { background: var(--delijn); }
.step.bus::before { background: #3A6EA5; }
.step.train::before, .step.nmbs::before { background: var(--nmbs); }
.step.metro::before, .step.gvb::before { background: var(--gvb); }
.step.ferry::before { background: #1B9AAA; }
.step.plane::before { background: #4B4F5B; }
.step:last-child { padding-bottom: 0; }
.step:last-child::before { display: none; }
.si { width: 40px; height: 40px; border-radius: 50%; background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; color: var(--fg); position: relative; z-index: 1; }
.step.tram .si, .step.delijn .si { background: var(--delijn); color: var(--delijn-ink); border-color: transparent; }
.step.bus .si { background: #3A6EA5; color: #fff; border-color: transparent; }
.step.train .si, .step.nmbs .si { background: var(--nmbs); color: #fff; border-color: transparent; }
.step.metro .si, .step.gvb .si { background: var(--gvb); color: #fff; border-color: transparent; }
.step.ferry .si { background: #1B9AAA; color: #fff; border-color: transparent; }
.step.plane .si { background: #4B4F5B; color: #fff; border-color: transparent; }
.sc { padding-top: 8px; min-width: 0; }
.st { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 700; font-size: 15px; }
.st .dir { font-weight: 500; color: var(--fg-2); font-size: 14px; }
.st .dur { margin-left: auto; font-size: 13px; color: var(--fg-2); font-weight: 600; font-variant-numeric: tabular-nums; }
.sd { font-size: 13px; color: var(--fg-2); margin-top: 4px; line-height: 1.45; }
.stops { margin-top: 10px; font-size: 13px; }
.stops div { display: flex; gap: 10px; align-items: baseline; padding: 3px 0; }
.stops div::before { content: ''; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--fg-3); flex: none; position: relative; top: 1px; }
.stops div.key::before { border-color: var(--fg); background: var(--fg); }
.stops .n { color: var(--fg-2); }
.stops div span:not(.n) { color: var(--fg-3); margin-left: auto; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
.tk, .warn { margin-top: 10px; padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; display: flex; gap: 8px; align-items: flex-start; line-height: 1.4; }
.tk { color: var(--k-sight); }
.warn { color: var(--k-food); }
.tk .ic, .warn .ic { margin-top: 2px; flex: none; }
.apps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
.apps a { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px; color: var(--fg); font-size: 12px; font-weight: 700; transition: transform .15s; }
.apps a:active { transform: scale(.95); }
.apps a .ic { color: var(--sec, var(--c-plan)); }
.alt { margin-top: 20px; }
.alt .eyebrow { margin-bottom: 12px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-2); }
.ac + .ac { margin-top: 12px; }
.ac b { display: block; font-size: 15px; font-weight: 700; }
.ac p { font-size: 13px; color: var(--fg-2); margin-top: 2px; line-height: 1.45; }
</style>
