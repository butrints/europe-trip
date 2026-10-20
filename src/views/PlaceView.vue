<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTrip, navLinks, distanceKm } from '@/composables/useTrip';
import { useChecklist } from '@/composables/useStore';
import { usePicks } from '@/composables/usePicks';
import { toast } from '@/composables/useSheet';
import { parseIso } from '@/composables/useNow';
import Icon from '@/components/ui/Icon.vue';
import SmartImg from '@/components/ui/SmartImg.vue';

const route = useRoute();
const { trip, place, city } = useTrip();
const t = trip.value;
const p = computed(() => place(String(route.params.id)));
const visited = useChecklist(`${t.slug}:visited`);
const picks = usePicks(t.slug);
const showDays = ref(false);
const links = computed(() => (p.value ? navLinks(t.base.confirmed ? t.base.pos : undefined, p.value.pos, p.value.name) : null));
const dist = computed(() => {
  if (!p.value || !t.base.confirmed) return null;
  const km = distanceKm(t.base.pos, p.value.pos);
  return km < 1 ? `${Math.round(km * 1000)} m from apartment` : `${km.toFixed(1)} km from apartment`;
});
const fixedDays = computed(() => t.days.filter((d) => d.items.some((i) => i.placeId === p.value?.id && i.time)));
const pickedDays = computed(() => (p.value ? picks.daysWith(p.value.id) : []));
const dayLabel = (iso: string) => parseIso(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
const tagClass = (x: string) => ({ must: 'ember', free: 'pine', book: 'gold', romantic: 'rose', rainy: 'sky', evening: 'plum' }[x] ?? '');

function pick(date: string) {
  if (!p.value) return;
  picks.toggle(date, p.value.id);
  toast(picks.has(date, p.value.id) ? `Added to ${dayLabel(date)}` : `Removed from ${dayLabel(date)}`);
}
async function share() {
  if (!p.value) return;
  const url = location.href;
  try {
    if (navigator.share) await navigator.share({ title: p.value.name, text: p.value.blurb, url });
    else { await navigator.clipboard.writeText(url); toast('Link copied'); }
  } catch { /* cancelled */ }
}
</script>

<template>
  <main v-if="p" class="page pv">
    <div class="hero">
      <SmartImg :src="p.img" :alt="p.name"><Icon name="pin" :size="36" /></SmartImg>
      <div class="scrim" />
    </div>
    <header class="head">
      <div class="tags">
        <span class="tag">{{ city(p.city)?.name }}</span>
        <span v-if="p.rating === 3" class="tag ember"><Icon name="star" :size="11" />must</span>
        <span v-for="x in p.tags?.filter(t => t !== 'must' || p!.rating !== 3)" :key="x" class="tag" :class="tagClass(x)">{{ x }}</span>
      </div>
      <h1 class="display">{{ p.name }}</h1>
      <p class="blurb">{{ p.blurb }}</p>
    </header>

    <!-- Add to day -->
    <section class="addday">
      <button class="btn btn-ink btn-block" @click="showDays = !showDays">
        <Icon name="calendar" />
        <span v-if="pickedDays.length">On {{ pickedDays.map(dayLabel).join(', ') }} · change</span>
        <span v-else>Add to a day</span>
      </button>
      <Transition name="fade">
        <div v-if="showDays" class="dayrow">
          <button v-for="d in t.days" :key="d.date" class="dchip" :class="{ on: picks.has(d.date, p.id), fixed: fixedDays.some(f => f.date === d.date) }" @click="pick(d.date)">
            <small>{{ parseIso(d.date).toLocaleDateString('en-GB', { weekday: 'short' }) }}</small>
            <b class="num">{{ parseIso(d.date).getDate() }}</b>
          </button>
        </div>
      </Transition>
      <p v-if="fixedDays.length" class="faint small">Fixed in plan on {{ fixedDays.map(d => dayLabel(d.date)).join(', ') }}.</p>
    </section>

    <div class="facts">
      <div v-if="p.hours" class="f"><span class="k"><Icon name="clock" :size="13" />Hours</span><span class="v">{{ p.hours }}</span></div>
      <div v-if="p.price" class="f"><span class="k"><Icon name="euro" :size="13" />Price</span><span class="v num">{{ p.price }}</span></div>
      <div v-if="p.duration" class="f"><span class="k"><Icon name="clock" :size="13" />Allow</span><span class="v">{{ p.duration }}</span></div>
      <div v-if="p.stop" class="f" :class="{ wide: !p.duration }"><span class="k"><Icon name="tram" :size="13" />Nearest stop</span><span class="v">{{ p.stop }}</span></div>
      <div v-if="p.address" class="f wide"><span class="k"><Icon name="pin" :size="13" />Address</span><span class="v">{{ p.address }}<small v-if="dist"> · {{ dist }}</small></span></div>
    </div>

    <div v-if="p.book" class="book card">
      <div class="bt">
        <b>{{ p.book.required ? 'Booking required' : 'Booking recommended' }}</b>
        <p v-if="p.book.note">{{ p.book.note }}</p>
      </div>
      <a class="btn btn-ember btn-sm" :href="p.book.url" target="_blank" rel="noopener"><Icon name="ticket" :size="16" />{{ p.book.label ?? 'Book' }}</a>
    </div>

    <section v-if="p.about?.length" class="prose">
      <p v-for="(a, i) in p.about" :key="i">{{ a }}</p>
    </section>

    <section v-if="p.tips?.length" class="tips">
      <b><Icon name="sparkle" :size="14" /> Tips</b>
      <ul><li v-for="(x, i) in p.tips" :key="i">{{ x }}</li></ul>
    </section>

    <div class="actions">
      <a v-if="links" class="btn btn-ember" :href="links.google" target="_blank" rel="noopener"><Icon name="nav" />Navigate</a>
      <button class="btn btn-tonal" :class="{ on: visited.has(p.id) }" @click="visited.toggle(p.id)"><Icon name="check" />{{ visited.has(p.id) ? 'Visited' : 'Visited?' }}</button>
      <button class="btn btn-tonal sq" aria-label="Share" @click="share"><Icon name="share" /></button>
    </div>
    <div class="links">
      <a v-if="p.url" :href="p.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />Official site</a>
      <a v-if="links" :href="links.apple" target="_blank" rel="noopener"><Icon name="map" :size="14" />Apple Maps</a>
      <a v-if="links" :href="links.citymapper" target="_blank" rel="noopener"><Icon name="compass" :size="14" />Citymapper</a>
    </div>
    <p v-if="p.imgCredit" class="credit faint">Photo: {{ p.imgCredit }}</p>
  </main>
  <div v-else class="empty"><p class="display">Place not found</p></div>
</template>

<style scoped>
.hero { position: relative; margin: 0 calc(-1 * var(--gutter)); height: 260px; }
.scrim { position: absolute; inset: 0; background: linear-gradient(to top, var(--paper) 0%, transparent 50%); }
.head { margin-top: -36px; position: relative; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.head h1 { font-size: 2.25rem; }
.blurb { margin-top: 8px; font-size: 1rem; color: var(--ink-2); line-height: 1.5; }
.addday { margin-top: 16px; }
.dayrow { display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; }
.dayrow::-webkit-scrollbar { display: none; }
.dchip { flex: 1; min-width: 50px; display: flex; flex-direction: column; align-items: center; padding: 7px 4px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); color: var(--ink-2); line-height: 1.1; transition: all .2s var(--ease-spring); }
.dchip small { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.dchip b { font-family: var(--font-display); font-size: 1.125rem; font-weight: 500; color: var(--ink); margin-top: 2px; }
.dchip.on { background: var(--ember); border-color: var(--ember); color: #fff; }
.dchip.on b { color: #fff; }
.dchip.fixed { border-style: dashed; }
.small { font-size: 0.75rem; margin-top: 8px; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
.f { padding: 11px 12px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 3px; }
.f.wide { grid-column: 1 / -1; }
.k { display: inline-flex; align-items: center; gap: 5px; font-size: 0.625rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.v { font-size: 0.9375rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.35; }
.v small { font-weight: 500; color: var(--ink-2); font-size: 0.75rem; }
.book { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-top: 12px; border-color: var(--gold); background: var(--gold-soft); }
.bt { flex: 1; min-width: 0; }
.bt b { font-weight: 600; font-size: 0.9375rem; }
.bt p { font-size: 0.8125rem; color: var(--ink-2); margin-top: 2px; line-height: 1.4; }
.prose { margin-top: 20px; font-size: 0.9375rem; line-height: 1.6; }
.prose p + p { margin-top: 10px; }
.tips { margin-top: 18px; padding: 14px 16px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); font-size: 0.875rem; }
.tips b { display: flex; align-items: center; gap: 6px; color: var(--ember); margin-bottom: 6px; }
.tips ul { padding-left: 18px; list-style: disc; }
.tips li + li { margin-top: 4px; }
.actions { position: sticky; bottom: calc(var(--tabbar) + var(--sab) + 20px); display: flex; gap: 8px; margin-top: 24px; padding: 8px; border-radius: var(--r-pill); background: var(--glass-strong); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border: 1px solid var(--line); box-shadow: var(--shadow-2); }
.actions .btn { flex: 1; }
.actions .sq { flex: none; width: 46px; padding: 0; }
.actions .on { background: var(--pine-soft); color: var(--pine); }
.links { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 16px; font-size: 0.8125rem; font-weight: 500; }
.links a { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-2); }
.credit { font-size: 0.6875rem; margin-top: 12px; text-align: center; }
</style>
