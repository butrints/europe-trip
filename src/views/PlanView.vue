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
    <section class="hero" :class="{ noimg: !day.hero }">
      <SmartImg v-if="day.hero" :src="day.hero" :alt="day.title" />
      <div class="scrim" />
      <div class="hb">
        <p class="eyebrow">Day {{ dayNum }} of {{ t.days.length }} · {{ fullDate }}</p>
        <h1 class="display italic">{{ day.title }}</h1>
      </div>
    </section>
    <p class="sum">{{ day.summary }}</p>

    <section v-if="cd.phase === 'before'" class="now">
      <div class="nl">Departure in</div>
      <div class="cd num">
        <div><b>{{ cd.days }}</b><span>days</span></div>
        <div><b>{{ cd.hours }}</b><span>hours</span></div>
        <div><b>{{ cd.mins }}</b><span>min</span></div>
      </div>
      <p class="nm">{{ fmtRange(t.start, t.end) }} · {{ t.travellers.join(' & ') }}</p>
    </section>
    <section v-else-if="cd.phase === 'during' && isToday" class="now live">
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

    <section class="sunbar">
      <div class="sl">
        <span><Icon name="sun" :size="14" /> {{ sun.rise }}</span>
        <span class="dl">{{ daylight }}</span>
        <span>{{ sun.set }} <Icon name="moon" :size="14" /></span>
      </div>
      <div class="bar"><i :style="{ left: sunPct.left + '%', width: sunPct.width + '%' }" /><b v-if="isToday" :style="{ left: sunPct.now + '%' }" /></div>
    </section>

    <nav class="days chips" aria-label="Days">
      <button v-for="d in t.days" :key="d.date" class="dchip" :class="{ active: d.date === sel, today: d.date === today }" @click="sel = d.date">
        <small>{{ wd(d.date) }}</small>
        <b class="num">{{ dn(d.date) }}</b>
        <em>{{ mo(d.date) }}</em>
      </button>
    </nav>

    <div v-if="day.tags?.length" class="dtags"><span v-for="tg in day.tags" :key="tg" class="tag ember">{{ tg }}</span></div>

    <!-- Fixed anchors -->
    <section v-if="anchors.length" class="block">
      <div class="bh"><span class="eyebrow"><Icon name="clock" :size="12" /> Fixed times</span><span class="faint tiny">{{ dayCity?.name }}</span></div>
      <TimelineItem v-for="it in anchors" :key="it.id" :item="it" :done="done.has(it.id)" :is-now="it.id === currentId" :is-past="isPast(it.id)" @toggle="done.toggle(it.id)" />
    </section>

    <!-- Your picks -->
    <section class="block">
      <div class="bh"><span class="eyebrow"><Icon name="heart" :size="12" /> Your picks · any order</span><RouterLink class="more" :to="{ name: 'explore' }">Explore +</RouterLink></div>
      <div v-if="pickPlaces.length" class="picks">
        <div v-for="(p, i) in pickPlaces" :key="p.id" class="pick">
          <PlaceCard :place="p" :visited="visited.has(p.id)" />
          <div class="pa">
            <button class="pb" :disabled="i === 0" aria-label="Move up" @click="picks.move(sel, p.id, -1)"><Icon name="chevron" :size="14" class="up" /></button>
            <button class="pb" :disabled="i === pickPlaces.length - 1" aria-label="Move down" @click="picks.move(sel, p.id, 1)"><Icon name="chevron" :size="14" class="down" /></button>
            <a class="pb go" :href="nav(p)" target="_blank" rel="noopener" aria-label="Navigate"><Icon name="nav" :size="15" /></a>
            <button class="pb rm" aria-label="Remove" @click="picks.toggle(sel, p.id)"><Icon name="close" :size="14" /></button>
          </div>
        </div>
      </div>
      <div v-else class="card hint">
        <Icon name="compass" />
        <p>Nothing picked for this day yet. Open <RouterLink :to="{ name: 'explore' }">Explore</RouterLink>, tap a place, then <b>Add to day</b>. Order is yours.</p>
      </div>
    </section>

    <!-- Ideas pool -->
    <section v-if="ideas.length" class="block">
      <div class="bh"><span class="eyebrow"><Icon name="sparkle" :size="12" /> Ideas for this day</span><span class="faint tiny">{{ ideas.length }}</span></div>
      <TimelineItem v-for="it in ideas" :key="it.id" :item="it" :done="done.has(it.id)" :is-now="false" :is-past="false" compact @toggle="done.toggle(it.id)" />
    </section>

    <WeatherStrip v-for="c in wxCities" :key="c.id" :city="c" :start="t.start" :end="t.end" :today="today" />
  </main>
</template>

<style scoped>
.hero { position: relative; margin: 0 calc(-1 * var(--gutter)); height: 280px; }
.hero :deep(.img) { position: absolute; inset: 0; }
.hero.noimg { height: auto; }
.scrim { position: absolute; inset: 0; background: linear-gradient(to top, var(--paper) 0%, color-mix(in srgb, var(--paper) 88%, transparent) 30%, color-mix(in srgb, var(--paper) 30%, transparent) 60%, transparent 100%); }
.hero.noimg .scrim { display: none; }
.hb { position: absolute; left: var(--gutter); right: var(--gutter); bottom: 2px; }
.hero.noimg .hb { position: static; padding: 28px 0 0; }
.hb .eyebrow { margin-bottom: 8px; }
.hb h1 { font-size: 2.5rem; }
.sum { margin-top: 10px; font-size: 0.9375rem; color: var(--ink-2); line-height: 1.5; }

.now { margin-top: 18px; padding: 18px; border-radius: var(--r-lg); background: var(--ink); color: var(--paper); }
.now.live { background: var(--ember); color: #fff; }
.nl { font-size: 0.6875rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; opacity: .65; }
.nb { font-family: var(--font-display); font-size: 1.5rem; margin-top: 4px; letter-spacing: -0.01em; line-height: 1.15; }
.nm { font-size: 0.8125rem; opacity: .75; margin-top: 6px; }
.cd { display: flex; gap: 22px; margin-top: 8px; }
.cd b { display: block; font-family: var(--font-display); font-size: 2.25rem; font-weight: 500; letter-spacing: -0.03em; line-height: 1; }
.cd span { font-size: 0.625rem; text-transform: uppercase; letter-spacing: .1em; opacity: .6; }

.sunbar { margin-top: 16px; }
.sl { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--ink-2); font-weight: 500; }
.sl span { display: inline-flex; align-items: center; gap: 4px; }
.sl .dl { font-weight: 600; color: var(--ink); }
.bar { position: relative; height: 6px; border-radius: 3px; background: var(--line); margin-top: 8px; }
.bar i { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: linear-gradient(90deg, var(--gold), #F3C85A, var(--gold)); }
.bar b { position: absolute; top: -4px; width: 14px; height: 14px; border-radius: 50%; background: var(--ember); border: 2px solid var(--paper); transform: translateX(-50%); box-shadow: var(--shadow-1); }

.days { margin-top: 20px; }
.dchip { flex: none; display: flex; flex-direction: column; align-items: center; min-width: 60px; padding: 8px 10px; border-radius: 16px; background: var(--card); border: 1px solid var(--line); color: var(--ink-2); line-height: 1.1; transition: all .25s var(--ease); scroll-snap-align: start; }
.dchip small { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.dchip b { font-family: var(--font-display); font-size: 1.375rem; font-weight: 500; color: var(--ink); margin: 2px 0; }
.dchip em { font-style: normal; font-size: 0.625rem; }
.dchip.today { border-color: var(--ember); }
.dchip.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }
.dchip.active b { color: var(--paper); }
.dchip:active { transform: scale(0.95); }
.dtags { display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0 0; }

.block { margin-top: 22px; }
.bh { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.bh .eyebrow { display: inline-flex; align-items: center; gap: 5px; }
.bh .more { font-size: 0.8125rem; font-weight: 600; color: var(--ember); }
.tiny { font-size: 0.75rem; }
.picks { display: grid; gap: 10px; }
.pick { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: stretch; }
.pa { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
.pb { width: 34px; height: 30px; border-radius: 9px; background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; color: var(--ink-2); }
.pb:disabled { opacity: .35; }
.pb .up { transform: rotate(-90deg); }
.pb .down { transform: rotate(90deg); }
.pb.go { color: var(--ember); }
.pb.rm { color: var(--ink-3); }
.hint { display: flex; gap: 12px; align-items: center; padding: 14px; font-size: 0.875rem; color: var(--ink-2); line-height: 1.45; }
.hint .ic { color: var(--ember); }
.hint b { color: var(--ink); }
</style>
