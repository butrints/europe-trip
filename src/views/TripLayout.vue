<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TripData } from '@/types/trip';
import { tripMeta } from '@/trips';
import { provideTrip } from '@/composables/useTrip';
import { useTheme } from '@/composables/useTheme';
import { openRouteId, closeRoute, toast } from '@/composables/useSheet';
import { roomId, syncState, joinRoom } from '@/composables/useSync';
import Icon from '@/components/ui/Icon.vue';
import RouteSheet from '@/components/RouteSheet.vue';

const route = useRoute();
const router = useRouter();
const { pref, cycle } = useTheme();

const trip = shallowRef<TripData | null>(null);
const failed = ref(false);
const slug = computed(() => String(route.params.slug));

watch(slug, async (s) => {
  const meta = tripMeta(s);
  if (!meta) { failed.value = true; return; }
  trip.value = (await meta.load()).default;
}, { immediate: true });

provideTrip(computed(() => trip.value as TripData));

// Deep link ?room=<id>: join the shared room, then drop the param from the URL.
watch(() => route.query.room, (r) => {
  if (typeof r !== 'string' || !r) return;
  joinRoom(r).then(() => toast('Joined the shared room')).catch((e) => toast(e.message));
  router.replace({ name: String(route.name), params: route.params, query: { ...route.query, room: undefined } });
}, { immediate: true });

const tabs = [
  { name: 'plan', label: 'Plan', icon: 'calendar' },
  { name: 'explore', label: 'Explore', icon: 'compass' },
  { name: 'map', label: 'Map', icon: 'map' },
  { name: 'transit', label: 'Transit', icon: 'train' },
  { name: 'info', label: 'Info', icon: 'info' },
];
const active = computed(() => (route.name === 'place' ? 'explore' : String(route.name)));
const activeIdx = computed(() => Math.max(0, tabs.findIndex((t) => t.name === active.value)));
const isSub = computed(() => route.name === 'place');
const secOf = (n: unknown) => (n === 'place' ? 'explore' : ['plan','explore','map','transit','info'].includes(String(n)) ? String(n) : 'plan');
// Mirror the section on <html> so teleported sheets/toasts (outside .shell) get the same --sec.
watchEffect(() => { document.documentElement.dataset.sec = secOf(route.name); });
onBeforeUnmount(() => { delete document.documentElement.dataset.sec; });

// Hierarchical "up" navigation, not browser history: a place goes back to the tab it was opened from,
// a tab root goes to the trips list. Tab switches use `replace` so history never piles up.
const TABS = ['plan', 'explore', 'map', 'transit', 'info'];
const lastTab = ref<{ name: string; query: Record<string, string> }>({ name: 'plan', query: {} });
watch(() => route.name, (n) => {
  if (TABS.includes(String(n))) { const { room: _room, ...q } = route.query as Record<string, string>; lastTab.value = { name: String(n), query: q }; }
}, { immediate: true });
function back() {
  if (isSub.value) router.replace({ name: lastTab.value.name, params: { slug: slug.value }, query: lastTab.value.query });
  else router.push({ name: 'trips' });
}
</script>

<template>
  <div v-if="trip" class="shell" :data-sec="secOf(route.name)">
    <header class="hdr">
      <button class="hb" :aria-label="isSub ? 'Back' : 'All trips'" @click="back"><Icon :name="isSub ? 'back' : 'grid'" /></button>
      <div class="ht">
        <span class="t">{{ trip.title }}</span>
        <span class="s">{{ trip.flag }} {{ trip.kicker }}</span>
      </div>
      <span v-if="roomId" class="sync-dot" :class="syncState" :title="syncState" />
      <button class="hb" :aria-label="`Theme: ${pref}`" @click="cycle"><Icon :name="pref === 'auto' ? 'auto' : pref === 'dark' ? 'moon' : 'sun'" /></button>
    </header>

    <RouterView v-slot="{ Component }">
      <Transition name="view" mode="out-in">
        <component :is="Component" :key="route.name === 'place' ? String(route.params.id) : String(route.name)" />
      </Transition>
    </RouterView>

    <nav class="tabbar" aria-label="Sections">
      <span class="pill" :style="{ transform: `translateX(calc(${activeIdx} * (100% + 2px)))` }" aria-hidden="true" />
      <RouterLink v-for="t in tabs" :key="t.name" class="tab" :class="{ active: active === t.name }"
                  :to="{ name: t.name, params: { slug } }" replace>
        <Icon :name="t.icon" />
        <span>{{ t.label }}</span>
      </RouterLink>
    </nav>

    <RouteSheet :route-id="openRouteId" @close="closeRoute" />
  </div>
  <div v-else-if="failed" class="empty"><p>Trip not found</p><RouterLink to="/">Back to trips</RouterLink></div>
  <div v-else class="loading"><div class="spin" /></div>
</template>

<style scoped>
.shell { min-height: 100dvh; }
.hdr { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 8px; max-width: var(--maxw); margin: 0 auto; padding: calc(var(--sat) + 24px) calc(var(--gutter) - 8px) 8px; background: var(--bg); border-bottom: 1px solid var(--line); }
.hb { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: var(--fg-2); transition: background .15s; }
.hb:active { background: var(--bg-2); }
.sync-dot { width: 8px; height: 8px; margin-right: 2px; border-radius: 50%; flex: none; background: var(--fg-3); }
.sync-dot.live { background: var(--k-free); }
.sync-dot.connecting, .sync-dot.offline { background: var(--k-food); }
.sync-dot.error { background: var(--k-home); }
.ht { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ht .t { font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.ht .s { font-size: 12px; color: var(--fg-2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

.tabbar { position: fixed; left: 50%; bottom: calc(var(--sab) + 12px); transform: translateX(-50%); z-index: 60; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; width: calc(100% - 2 * var(--gutter)); max-width: calc(var(--maxw) - 40px); padding: 6px; border-radius: var(--r-pill); background: var(--card); border: 1px solid var(--line); box-shadow: var(--sh-2); isolation: isolate; }
.pill { position: absolute; top: 6px; bottom: 6px; left: 6px; width: calc((100% - 12px - 8px) / 5); border-radius: var(--r-pill); background: var(--sec); z-index: 0; transition: transform .38s cubic-bezier(.32, 1.25, .45, 1), background .25s; will-change: transform; }
.tab { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; height: 50px; min-width: 0; padding: 0 4px; border-radius: var(--r-pill); color: var(--fg-2); font-size: 10px; font-weight: 700; letter-spacing: .02em; transition: color .25s, transform .15s; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.tab:active { transform: scale(.94); }
.tab span { display: block; line-height: 1; }
.tab.active { color: #fff; }
.tab .ic { width: 20px; height: 20px; }

/* page change: snappy, fluid */
.view-enter-active { transition: opacity .22s cubic-bezier(.2, .8, .2, 1), transform .26s cubic-bezier(.2, .8, .2, 1); }
.view-leave-active { transition: opacity .12s ease-in, transform .12s ease-in; }
.view-enter-from { opacity: 0; transform: translateY(10px) scale(.985); }
.view-leave-to { opacity: 0; transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) { .pill, .view-enter-active, .view-leave-active { transition: none; } }

.loading { display: grid; place-items: center; height: 100dvh; }
.spin { width: 28px; height: 28px; border-radius: 50%; border: 3px solid var(--line-2); border-top-color: var(--sec, var(--c-plan)); animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
