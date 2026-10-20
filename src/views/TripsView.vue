<script setup lang="ts">
import { computed } from 'vue';
import { TRIPS } from '@/trips';
import { fmtRange, isoDate, useCountdown, useNow } from '@/composables/useNow';
import { useTheme } from '@/composables/useTheme';
import Icon from '@/components/ui/Icon.vue';
import SmartImg from '@/components/ui/SmartImg.vue';

const now = useNow();
const { pref, cycle } = useTheme();

const today = computed(() => isoDate(now.value));
const sorted = computed(() => [...TRIPS].sort((a, b) => a.start.localeCompare(b.start)));
const status = (t: { start: string; end: string }) =>
  today.value < t.start ? 'upcoming' : today.value > t.end ? 'past' : 'live';
const featured = computed(() => sorted.value.find((t) => status(t) === 'live') ?? sorted.value.find((t) => status(t) === 'upcoming'));
const rest = computed(() => sorted.value.filter((t) => t !== featured.value));
const cd = featured.value ? useCountdown(featured.value.start, featured.value.end) : null;
</script>

<template>
  <main class="page trips-page" style="--sec: var(--c-plan); --sec-soft: var(--k-home-soft)">
    <header class="top">
      <div>
        <p class="eyebrow">Travel journal</p>
        <h1 class="h1">Trips</h1>
      </div>
      <button class="themebtn" :aria-label="`Theme: ${pref}`" @click="cycle">
        <Icon :name="pref === 'auto' ? 'auto' : pref === 'dark' ? 'moon' : 'sun'" />
      </button>
    </header>

    <RouterLink v-if="featured" class="feature" :to="{ name: 'plan', params: { slug: featured.slug } }">
      <SmartImg :src="featured.cover" :alt="featured.title" />
      <div class="scrim" />
      <div class="body">
        <span class="pill" :class="status(featured)">{{ status(featured) === 'live' ? '● Happening now' : 'Next up' }}</span>
        <h2 class="ft">{{ featured.title }}</h2>
        <p class="k">{{ featured.flag }} {{ featured.kicker }} · {{ fmtRange(featured.start, featured.end) }}</p>
        <div v-if="cd && cd.phase === 'before'" class="cd num">
          <div><b>{{ cd.days }}</b><span>days</span></div>
          <div><b>{{ cd.hours }}</b><span>hrs</span></div>
          <div><b>{{ cd.mins }}</b><span>min</span></div>
        </div>
        <span class="btn go">Open plan <Icon name="chevron" :size="16" /></span>
      </div>
    </RouterLink>

    <section v-if="rest.length" class="section">
      <div class="sec-head"><span class="dot" /><span>More trips</span></div>
      <div class="grid">
        <RouterLink v-for="t in rest" :key="t.slug" class="tcard card" :to="{ name: 'plan', params: { slug: t.slug } }">
          <div class="cover"><SmartImg :src="t.cover" :alt="t.title" /></div>
          <div class="tb">
            <h3>{{ t.title }}</h3>
            <p>{{ t.flag }} {{ fmtRange(t.start, t.end) }}</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.trips-page { padding-bottom: 48px; }
.top { display: flex; align-items: flex-end; justify-content: space-between; padding: calc(var(--sat) + 28px) 0 20px; }
.top .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--sec); margin-bottom: 6px; }
.top .h1 { font-size: 28px; font-weight: 800; letter-spacing: -.01em; line-height: 1.15; text-wrap: balance; }
.themebtn { width: 40px; height: 40px; border-radius: 50%; background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; color: var(--fg-2); }
.feature { display: block; position: relative; height: 400px; border-radius: var(--r-xl); overflow: hidden; color: #fff; background: var(--c-plan); transition: transform .2s; }
.feature:active { transform: scale(.985); }
.feature :deep(.img) { position: absolute; inset: 0; opacity: .35; mix-blend-mode: luminosity; }
.scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(224,83,46,.1), rgba(224,83,46,.95)); }
.body { position: absolute; left: 0; right: 0; bottom: 0; padding: 20px; display: grid; gap: 8px; justify-items: start; }
.pill { display: inline-block; padding: 5px 11px; border-radius: var(--r-pill); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; background: rgba(255,255,255,.2); }
.ft { font-size: 28px; font-weight: 800; letter-spacing: -.01em; line-height: 1.15; text-wrap: balance; }
.k { font-size: 15px; opacity: .85; }
.cd { display: flex; gap: 20px; margin-top: 4px; font-variant-numeric: tabular-nums; }
.cd b { display: block; font-size: 28px; font-weight: 800; letter-spacing: -.01em; line-height: 1.1; }
.cd span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; opacity: .8; }
.go { margin-top: 8px; background: #fff; color: var(--c-plan); }
.grid { display: grid; gap: 12px; }
.tcard { display: flex; align-items: center; gap: 14px; padding: 12px; color: var(--fg); }
.cover { width: 100px; height: 80px; border-radius: var(--r-md); overflow: hidden; flex: none; }
.cover :deep(.img) { width: 100%; height: 100%; }
.tb { min-width: 0; }
.tb h3 { font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.15; }
.tb p { font-size: 13px; color: var(--fg-2); margin-top: 4px; }
</style>
