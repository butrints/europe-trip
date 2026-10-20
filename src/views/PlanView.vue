<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTrip, navLinks } from '@/composables/useTrip';
import { fmtRange, isoDate, parseIso, toMin, useCountdown, useNow } from '@/composables/useNow';
import { useChecklist } from '@/composables/useStore';
import { usePicks } from '@/composables/usePicks';
import Icon from '@/components/ui/Icon.vue';
import TimelineItem from '@/components/TimelineItem.vue';
import PlaceCard from '@/components/PlaceCard.vue';
import WeatherStrip from '@/components/WeatherStrip.vue';

const { trip, city, place } = useTrip();
const now = useNow();
const route = useRoute();
const router = useRouter();
const t = trip.value;
const today = computed(() => isoDate(now.value));
const cd = useCountdown(t.start, t.end);
const done = useChecklist(`${t.slug}:done`);
const visited = useChecklist(`${t.slug}:visited`);
const picks = usePicks(t.slug);

const initial = (() => {
  const q = String(route.query.d ?? '');
  if (t.days.some((d) => d.date === q)) return q;
  if (t.days.some((d) => d.date === today.value)) return today.value;
  return t.days[0].date;
})();
const sel = ref(initial);
watch(sel, (d) => router.replace({ query: { ...route.query, d } }));

const day = computed(() => t.days.find((d) => d.date === sel.value)!);
const dayCity = computed(() => city(day.value.city));
const dayNum = computed(() => t.days.findIndex((d) => d.date === sel.value) + 1);
const isToday = computed(() => sel.value === today.value);
const nowMin = computed(() => now.value.getHours() * 60 + now.value.getMinutes());

const anchors = computed(() => day.value.items.filter((i) => i.time));
const ideas = computed(() => day.value.items.filter((i) => !i.time));
const pickPlaces = computed(() => (picks.map.value[sel.value] ?? []).map((id) => place(id)).filter((p): p is NonNullable<typeof p> => !!p));

const currentId = computed(() => {
  if (!isToday.value) return null;
  const past = anchors.value.filter((i) => toMin(i.time!) <= nowMin.value);
  return past.length ? past[past.length - 1].id : null;
});
const nextItem = computed(() => (isToday.value ? anchors.value.find((i) => toMin(i.time!) > nowMin.value) : undefined));
const isPast = (id: string) => isToday.value && anchors.value.some((i) => i.id === id && toMin(i.time!) < nowMin.value) && id !== currentId.value;

const wd = (iso: string) => parseIso(iso).toLocaleDateString('en-GB', { weekday: 'short' });
const dn = (iso: string) => parseIso(iso).getDate();
const mo = (iso: string) => parseIso(iso).toLocaleDateString('en-GB', { month: 'short' });
const fullDate = computed(() => parseIso(sel.value).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));

const sun = computed(() => day.value.sun ?? { rise: '08:28', set: '16:36' });
const sunPct = computed(() => {
  const r = toMin(sun.value.rise), s = toMin(sun.value.set);
  return { left: (r / 1440) * 100, width: ((s - r) / 1440) * 100, now: (nowMin.value / 1440) * 100 };
});
const daylight = computed(() => {
  const total = toMin(sun.value.set) - toMin(sun.value.rise);
  if (!isToday.value) return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m of daylight`;
  const left = toMin(sun.value.set) - nowMin.value;
  if (left <= 0) return 'Dark — lights & markets time';
  if (nowMin.value < toMin(sun.value.rise)) return `Sunrise in ${toMin(sun.value.rise) - nowMin.value} min`;
  return `${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}m of daylight left`;
});
const wxCities = computed(() => (t.weatherCities ?? [t.cities[0].id]).map((id) => city(id)!).filter(Boolean));
const nav = (p: { pos: { lat: number; lng: number }; name: string }) => navLinks(t.base.confirmed ? t.base.pos : undefined, p.pos, p.name).google;

// view-only UI state
const sumOpen = ref(false);
const ideasOpen = ref(false);
watch(sel, () => { sumOpen.value = false; });
</script>

<template>
  <main class="page plan">
    <section class="hero">
      <p class="hero-k num">Day {{ dayNum }} of {{ t.days.length }} · {{ fullDate }}</p>
      <h1 class="hero-t">{{ day.title }}</h1>
      <div class="sum">
        <p class="hero-s" :class="{ open: sumOpen }">{{ day.summary }}</p>
        <button v-if="day.summary.length > 70" class="sum-t" :aria-expanded="sumOpen" @click="sumOpen = !sumOpen">{{ sumOpen ? 'Less' : 'More' }}</button>
      </div>
      <div class="sun">
        <div class="sl num">
          <span>☀ {{ sun.rise }}</span>
          <span class="dl">{{ daylight }}</span>
          <span>{{ sun.set }} ☾</span>
        </div>
        <div class="bar"><i :style="{ left: sunPct.left + '%', width: sunPct.width + '%' }" /><b v-if="isToday" :style="{ left: sunPct.now + '%' }" /></div>
      </div>
    </section>

    <section v-if="cd.phase === 'before'" class="now card tint pad" style="--tint: var(--sec-soft)">
      <div class="nl">Departure in</div>
      <div class="cd num">
        <div><b>{{ cd.days }}</b><span>days</span></div>
        <div><b>{{ cd.hours }}</b><span>hours</span></div>
        <div><b>{{ cd.mins }}</b><span>min</span></div>
      </div>
      <p class="nm">{{ fmtRange(t.start, t.end) }} · {{ t.travellers.join(' & ') }}</p>
    </section>
    <section v-else-if="cd.phase === 'during' && isToday" class="now card tint pad" style="--tint: var(--sec-soft)">
      <div class="nl">Right now</div>
      <template v-if="nextItem">
        <div class="nb">Next fixed: {{ nextItem.title }}</div>
        <p class="nm num">at {{ nextItem.time }}<span v-if="nextItem.sub"> · {{ nextItem.sub }}</span></p>
      </template>
      <template v-else>
        <div class="nb">No more fixed times today</div>
        <p class="nm">Free roaming — pick from ideas below.</p>
      </template>
    </section>

    <nav class="days chips" aria-label="Days">
      <button v-for="d in t.days" :key="d.date" class="chip dchip" :class="{ on: d.date === sel, today: d.date === today }" :aria-pressed="d.date === sel" @click="sel = d.date">
        <small>{{ wd(d.date) }}</small>
        <b class="num">{{ dn(d.date) }}</b>
        <em>{{ mo(d.date) }}</em>
      </button>
    </nav>

    <div v-if="day.tags?.length" class="dtags"><span v-for="tg in day.tags" :key="tg" class="tag" style="--tag: var(--sec); --tag-soft: var(--sec-soft)">{{ tg }}</span></div>

    <!-- Fixed anchors -->
    <section v-if="anchors.length">
      <div class="sec-head"><span class="dot" />Fixed times<span class="count">{{ anchors.length }}</span><span v-if="dayCity" class="where">{{ dayCity.name }}</span></div>
      <div class="stack">
        <TimelineItem v-for="it in anchors" :key="it.id" :item="it" :done="done.has(it.id)" :is-now="it.id === currentId" :is-past="isPast(it.id)" @toggle="done.toggle(it.id)" />
      </div>
    </section>

    <!-- Your picks -->
    <section>
      <div class="sec-head"><span class="dot" />Your picks · any order<span v-if="pickPlaces.length" class="count">{{ pickPlaces.length }}</span><RouterLink class="more" :to="{ name: 'explore' }">Explore +</RouterLink></div>
      <div v-if="pickPlaces.length" class="stack">
        <div v-for="(p, i) in pickPlaces" :key="p.id" class="pick">
          <PlaceCard :place="p" :visited="visited.has(p.id)" />
          <div class="pa">
            <button class="pb" :disabled="i === 0" aria-label="Move up" @click="picks.move(sel, p.id, -1)"><Icon name="chevron" :size="16" class="up" /></button>
            <button class="pb" :disabled="i === pickPlaces.length - 1" aria-label="Move down" @click="picks.move(sel, p.id, 1)"><Icon name="chevron" :size="16" class="down" /></button>
            <a class="pb go" :href="nav(p)" target="_blank" rel="noopener" aria-label="Navigate"><Icon name="nav" :size="16" /></a>
            <button class="pb" aria-label="Remove" @click="picks.toggle(sel, p.id)"><Icon name="close" :size="16" /></button>
          </div>
        </div>
      </div>
      <div v-else class="card pad hint">
        <span class="ico-tile" style="--k: var(--sec); --k-soft: var(--sec-soft)"><Icon name="compass" :size="18" /></span>
        <p>Nothing picked for this day yet. Open <RouterLink :to="{ name: 'explore' }">Explore</RouterLink>, tap a place, then <b>Add to day</b>. Order is yours.</p>
      </div>
    </section>

    <!-- Ideas pool -->
    <section v-if="ideas.length">
      <div class="sec-head">
        <span class="dot" />Ideas for this day
        <button class="more" :aria-expanded="ideasOpen" @click="ideasOpen = !ideasOpen">{{ ideasOpen ? 'Hide' : `Show ideas (${ideas.length})` }}</button>
      </div>
      <div v-if="ideasOpen" class="stack">
        <TimelineItem v-for="it in ideas" :key="it.id" :item="it" :done="done.has(it.id)" :is-now="false" :is-past="false" compact @toggle="done.toggle(it.id)" />
      </div>
    </section>

    <!-- Weather -->
    <section v-if="wxCities.length">
      <div class="sec-head"><span class="dot" />Weather</div>
      <div class="stack">
        <WeatherStrip v-for="c in wxCities" :key="c.id" :city="c" :start="t.start" :end="t.end" :today="today" />
      </div>
    </section>
  </main>
</template>

<style scoped>
/* hero */
.sum { display: grid; gap: 4px; justify-items: start; }
.sum-t { font-size: 13px; font-weight: 600; color: #fff; text-decoration: underline; text-underline-offset: 2px; }
.sun { display: grid; gap: 8px; margin-top: 4px; }
.sl { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #fff; }
.sl .dl { text-align: center; }
.bar { position: relative; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, .28); }
.bar i { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: #FFD84D; }
.bar b { position: absolute; top: -4px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transform: translateX(-50%); box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }

/* countdown / right now */
.now { margin-top: 12px; display: grid; gap: 6px; }
.nl { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--sec); }
.nb { font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--fg); text-wrap: balance; }
.nm { font-size: 13px; color: var(--fg-2); }
.cd { display: flex; gap: 24px; }
.cd b { display: block; font-size: 28px; font-weight: 800; letter-spacing: -.01em; line-height: 1.1; color: var(--sec); }
.cd span { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-2); }

/* day picker */
.days { margin-top: 16px; padding-top: 2px; padding-bottom: 2px; }
.dchip { flex-direction: column; justify-content: center; gap: 2px; min-width: 58px; padding: 8px 10px; border-radius: var(--r-lg); line-height: 1.1; }
.dchip small, .dchip em { font-size: 11px; font-style: normal; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
.dchip em { text-transform: none; letter-spacing: 0; }
.dchip b { font-size: 17px; font-weight: 800; color: var(--fg); }
.dchip.on b { color: #fff; }
.dchip.today:not(.on) { border-color: var(--sec); box-shadow: inset 0 0 0 1px var(--sec); }
.dtags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }

/* sections */
.sec-head .where { margin-left: auto; font-size: 13px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--fg-3); }
.stack { display: grid; gap: 12px; }

/* picks */
.pick { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
.pa { display: grid; gap: 6px; }
.pb { width: 34px; height: 34px; border-radius: var(--r-sm); background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; color: var(--fg-2); transition: transform .2s var(--ease); }
.pb:active { transform: scale(.94); }
.pb:disabled { opacity: .35; }
.pb .up { transform: rotate(-90deg); }
.pb .down { transform: rotate(90deg); }
.pb.go { color: var(--sec); }
.hint { display: flex; gap: 12px; align-items: center; font-size: 14px; line-height: 1.45; color: var(--fg-2); }
.hint a { color: var(--sec); font-weight: 600; }
.hint b { color: var(--fg); }
</style>
