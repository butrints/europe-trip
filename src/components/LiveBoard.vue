<script setup lang="ts">
import { useLiveTrains } from '@/composables/useLiveTrains';
import Icon from '@/components/ui/Icon.vue';

const props = defineProps<{ from: string; to: string }>();
const { deps, loading, error, updated, reload } = useLiveTrains(props.from, props.to);
const hm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
</script>

<template>
  <section class="live card pad">
    <div class="lh">
      <span class="dot" :class="{ off: error }" />
      <b>{{ from }} → {{ to }}</b>
      <span v-if="updated" class="upd num">{{ hm(updated) }}</span>
      <button class="rf btn-tonal" :class="{ spin: loading }" aria-label="Refresh" @click="reload"><Icon name="refresh" :size="16" /></button>
    </div>
    <p v-if="error" class="msg">Live data unavailable ({{ error }}). Check the SNCB / NS app.</p>
    <p v-else-if="!deps.length && loading" class="msg">Loading next departures…</p>
    <div v-else class="deps">
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
    <p class="src">Live from iRail (NMBS/SNCB). Refreshes every 90 s.</p>
  </section>
</template>

<style scoped>
.lh { display: flex; align-items: center; gap: 10px; }
.lh b { font-weight: 700; flex: 1; font-size: 15px; min-width: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--k-free); animation: pulse 2s infinite; flex: none; }
.dot.off { background: var(--fg-3); animation: none; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px var(--k-free-soft);} 50% { box-shadow: 0 0 0 7px transparent;} }
.upd { font-size: 11px; color: var(--fg-3); }
.rf { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; flex: none; }
.rf.spin .ic { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.msg { font-size: 13px; color: var(--fg-2); padding: 10px 0 4px; }
.deps { margin-top: 6px; }
.dep { display: grid; grid-template-columns: 64px 1fr auto; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); }
.dep:first-child { border-top: 0; }
.t { font-size: 22px; font-weight: 800; letter-spacing: -.01em; line-height: 1; }
.t small { display: block; font-size: 11px; color: var(--k-home); font-weight: 700; letter-spacing: 0; margin-top: 3px; }
.dep.cancel .t { text-decoration: line-through; color: var(--fg-3); }
.dep.cancel .t small { text-decoration: none; }
.r { display: flex; flex-direction: column; min-width: 0; }
.r b { font-weight: 600; font-size: 14px; }
.r span { font-size: 12px; color: var(--fg-2); }
.p { text-align: right; }
.p span { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-3); }
.p b { font-size: 17px; font-weight: 800; font-variant-numeric: tabular-nums; }
.p b.chg { color: var(--k-home); }
.src { font-size: 11px; color: var(--fg-3); margin-top: 8px; }
</style>
