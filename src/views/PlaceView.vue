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
import type { PlaceCategory } from '@/types/trip';

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
const catIcon: Record<PlaceCategory, string> = { sight: 'pin', view: 'eye', museum: 'museum', food: 'food', cafe: 'coffee', bar: 'coffee', market: 'bag', xmas: 'gift', shop: 'bag', park: 'tree', station: 'train', stay: 'home' };
const catLabel: Record<PlaceCategory, string> = { sight: 'Sight', view: 'Viewpoint', museum: 'Museum', food: 'Food', cafe: 'Café', bar: 'Bar', market: 'Market', xmas: 'Christmas', shop: 'Shopping', park: 'Park', station: 'Station', stay: 'Stay' };
const catKind: Record<PlaceCategory, string> = { sight: 'sight', view: 'view', museum: 'sight', food: 'food', cafe: 'food', bar: 'food', market: 'food', xmas: 'xmas', shop: 'shop', park: 'free', station: 'transit', stay: 'home' };
const kindVars = (c: PlaceCategory) => ({ '--k': `var(--k-${catKind[c]})`, '--k-soft': `var(--k-${catKind[c]}-soft)` });

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
  <main v-if="p" class="page pv" :style="kindVars(p.cat)">
    <div class="photo">
      <SmartImg :src="p.img" :alt="p.name"><span class="fb"><span class="ico-tile lg solid"><Icon :name="catIcon[p.cat]" :size="24" /></span></span></SmartImg>
      <div class="scrim" />
    </div>
    <header class="head">
      <div class="tags">
        <span class="tag kind">{{ catLabel[p.cat] }}</span>
        <span v-if="city(p.city)" class="tag city">{{ city(p.city)?.name }}</span>
        <span v-if="p.rating === 3" class="tag must">★ Must</span>
      </div>
      <h1 class="h1">{{ p.name }}</h1>
      <p class="blurb">{{ p.blurb }}</p>
    </header>

    <!-- Add to day -->
    <section class="addday">
      <button class="btn btn-fill btn-block" @click="showDays = !showDays">
        <Icon name="calendar" />
        <span v-if="pickedDays.length">On {{ pickedDays.map(dayLabel).join(', ') }} · change</span>
        <span v-else>Add to a day</span>
      </button>
      <Transition name="fade">
        <div v-if="showDays" class="chips dayrow">
          <button v-for="d in t.days" :key="d.date" class="chip" :class="{ on: picks.has(d.date, p.id), fixed: fixedDays.some(f => f.date === d.date) }" @click="pick(d.date)">
            {{ parseIso(d.date).toLocaleDateString('en-GB', { weekday: 'short' }) }} <b>{{ parseIso(d.date).getDate() }}</b>
          </button>
        </div>
      </Transition>
      <p v-if="fixedDays.length" class="fixed-note">Fixed in plan on {{ fixedDays.map(d => dayLabel(d.date)).join(', ') }}.</p>
    </section>

    <div class="facts">
      <div v-if="p.hours" class="card pad"><div class="fact"><span class="k"><Icon name="clock" :size="14" />Hours</span><span class="v">{{ p.hours }}</span></div></div>
      <div v-if="p.price" class="card pad"><div class="fact"><span class="k"><Icon name="euro" :size="14" />Price</span><span class="v num">{{ p.price }}</span></div></div>
      <div v-if="p.duration" class="card pad"><div class="fact"><span class="k"><Icon name="clock" :size="14" />Allow</span><span class="v">{{ p.duration }}</span></div></div>
      <div v-if="p.stop" class="card pad wide"><div class="fact"><span class="k"><Icon name="tram" :size="14" />Nearest stop</span><span class="v">{{ p.stop }}</span></div></div>
      <div v-if="p.address" class="card pad wide"><div class="fact"><span class="k"><Icon name="pin" :size="14" />Address</span><span class="v">{{ p.address }}<small v-if="dist"> · {{ dist }}</small></span></div></div>
    </div>

    <div v-if="p.book" class="book card tint pad" style="--tint: var(--k-food-soft)">
      <div class="bt">
        <b>{{ p.book.required ? 'Booking required' : 'Booking recommended' }}</b>
        <p v-if="p.book.note">{{ p.book.note }}</p>
      </div>
      <a class="btn btn-fill btn-sm" :href="p.book.url" target="_blank" rel="noopener"><Icon name="ticket" :size="16" />{{ p.book.label ?? 'Book' }}</a>
    </div>

    <section v-if="p.about?.length" class="prose">
      <p v-for="(a, i) in p.about" :key="i">{{ a }}</p>
    </section>

    <section v-if="p.tips?.length" class="tips card pad">
      <p class="tips-k"><Icon name="sparkle" :size="14" />Tips</p>
      <ul><li v-for="(x, i) in p.tips" :key="i">{{ x }}</li></ul>
    </section>

    <div class="actions card">
      <a v-if="links" class="btn btn-fill" :href="links.google" target="_blank" rel="noopener"><Icon name="nav" />Navigate</a>
      <button class="btn btn-tonal" :class="{ on: visited.has(p.id) }" @click="visited.toggle(p.id)"><Icon name="check" />{{ visited.has(p.id) ? 'Visited' : 'Visited?' }}</button>
      <button class="btn btn-tonal sq" aria-label="Share" @click="share"><Icon name="share" /></button>
    </div>
    <div class="links">
      <a v-if="p.url" :href="p.url" target="_blank" rel="noopener"><Icon name="external" :size="14" />Official site</a>
      <a v-if="links" :href="links.apple" target="_blank" rel="noopener"><Icon name="map" :size="14" />Apple Maps</a>
      <a v-if="links" :href="links.citymapper" target="_blank" rel="noopener"><Icon name="compass" :size="14" />Citymapper</a>
    </div>
    <p v-if="p.imgCredit" class="credit">Photo: {{ p.imgCredit }}</p>
  </main>
  <div v-else class="empty"><b>Place not found</b></div>
</template>

<style scoped>
.photo { position: relative; margin: -16px calc(-1 * var(--gutter)) 0; height: 240px; }
.fb { position: absolute; inset: 0; display: grid; place-items: center; background: var(--k-soft); }
.scrim { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent 55%); pointer-events: none; }
.head { position: relative; margin-top: -32px; display: grid; gap: 10px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag.kind { --tag: #fff; --tag-soft: var(--k); }
.tag.city { --tag: var(--fg-2); --tag-soft: var(--card); }
.tag.must { --tag: #fff; --tag-soft: var(--k-home); }
.blurb { font-size: 15px; line-height: 1.45; color: var(--fg-2); }
.addday { margin-top: 20px; }
.dayrow { margin-top: 12px; }
.dayrow .chip b { font-weight: 800; font-variant-numeric: tabular-nums; }
.dayrow .chip.fixed { border-style: dashed; border-color: var(--line-2); }
.dayrow .chip.fixed.on { border-color: rgba(255, 255, 255, .7); }
.fixed-note { margin-top: 8px; font-size: 12px; color: var(--fg-3); }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 28px; }
.facts .wide { grid-column: 1 / -1; }
.facts .v small { font-size: 12px; font-weight: 500; color: var(--fg-2); }
.book { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.bt { flex: 1; min-width: 0; display: grid; gap: 2px; }
.bt b { font-size: 15px; font-weight: 700; color: var(--fg); }
.bt p { font-size: 13px; line-height: 1.45; color: var(--fg-2); }
.prose { margin-top: 28px; font-size: 15px; line-height: 1.6; color: var(--fg); }
.prose p + p { margin-top: 12px; }
.tips { margin-top: 28px; font-size: 15px; line-height: 1.45; }
.tips-k { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--sec); }
.tips ul { padding-left: 18px; list-style: disc; }
.tips li::marker { color: var(--fg-3); }
.tips li + li { margin-top: 6px; }
.actions { position: sticky; bottom: calc(var(--tabbar) + var(--sab) + 24px); z-index: 5; display: flex; gap: 8px; margin-top: 28px; padding: 8px; border-radius: var(--r-xl); box-shadow: var(--sh-2); }
.actions .btn { flex: 1; }
.actions .sq { flex: none; width: 46px; padding: 0; }
.actions .btn-tonal.on { background: var(--k-free-soft); color: var(--k-free); }
.links { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 20px; font-size: 13px; font-weight: 600; }
.links a { display: inline-flex; align-items: center; gap: 4px; color: var(--fg-2); }
.credit { margin-top: 12px; font-size: 11px; color: var(--fg-3); text-align: center; }
.empty b { color: var(--fg); font-size: 17px; font-weight: 700; }
</style>
