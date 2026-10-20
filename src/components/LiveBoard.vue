<script setup lang="ts">
import { useLiveTrains } from '@/composables/useLiveTrains';
import Icon from '@/components/ui/Icon.vue';

const props = defineProps<{ from: string; to: string }>();
const { deps, loading, error, updated, reload } = useLiveTrains(props.from, props.to);
const hm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
</script>

<template>
  <section class="live card">
    <div class="lh">
      <span class="dot" :class="{ off: error }" />
      <b>{{ from }} → {{ to }}</b>
      <span v-if="updated" class="faint tiny num">{{ hm(updated) }}</span>
      <button class="rf" :class="{ spin: loading }" aria-label="Refresh" @click="reload"><Icon name="refresh" :size="16" /></button>
    </div>
    <p v-if="error" class="msg">Live data unavailable ({{ error }}). Check the SNCB / NS app.</p>
    <p v-else-if="!deps.length && loading" class="msg">Loading next departures…</p>
    <div v-else>
      <div v-for="(d, i) in deps.slice(0, 6)" :key="i" class="dep" :class="{ cancel: d.canceled }">
        <div class="t num">
          {{ hm(d.time) }}
          <small v-if="d.canceled">cancelled</small>
          <small v-else-if="d.delayMin > 0">+{{ d.delayMin }} min</small>
        </div>
        <div class="r">
          <b>{{ d.vehicle }}<span v-if="d.transfers"> · {{ d.transfers }} change{{ d.transfers > 1 ? 's' : '' }}</span></b>
          <span class="num">{{ d.duration }} · arrives {{ hm(d.arrival) }}</span>
        </div>
        <div class="p"><span>Platform</span><b :class="{ chg: d.platformChanged }">{{ d.platform }}</b></div>
      </div>
    </div>
    <p class="src faint">Live from iRail (NMBS/SNCB). Refreshes every 90 s.</p>
  </section>
</template>

<style scoped>
.live { padding: 14px 16px; }
.lh { display: flex; align-items: center; gap: 8px; }
.lh b { font-weight: 600; flex: 1; font-size: 0.9375rem; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--pine); animation: pulse 2s infinite; }
.dot.off { background: var(--ink-3); animation: none; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px var(--pine-soft);} 50% { box-shadow: 0 0 0 7px transparent;} }
.rf { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--ink-2); background: var(--paper-2); }
:root[data-theme="dark"] .rf { background: var(--card-2); }
.rf.spin .ic { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.tiny { font-size: 0.6875rem; }
.msg { font-size: 0.8125rem; color: var(--ink-2); padding: 10px 0 4px; }
.dep { display: grid; grid-template-columns: 64px 1fr auto; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); }
.dep:first-child { border-top: 0; margin-top: 6px; }
.t { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; letter-spacing: -0.01em; line-height: 1; }
.t small { display: block; font-family: var(--font-ui); font-size: 0.6875rem; color: var(--ember); font-weight: 600; margin-top: 3px; }
.dep.cancel .t { text-decoration: line-through; color: var(--ink-3); }
.r { display: flex; flex-direction: column; min-width: 0; }
.r b { font-weight: 600; font-size: 0.875rem; }
.r span { font-size: 0.75rem; color: var(--ink-2); }
.p { text-align: right; }
.p span { display: block; font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-3); }
.p b { font-size: 1rem; font-weight: 700; }
.p b.chg { color: var(--ember); }
.src { font-size: 0.6875rem; margin-top: 8px; }
</style>
