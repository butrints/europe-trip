<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import Icon from './Icon.vue';

const props = defineProps<{ open: boolean; title?: string; eyebrow?: string; sub?: string }>();
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
let startY = 0, dy = 0, dragging = false;

function onStart(e: TouchEvent) {
  const body = panel.value?.querySelector('.sb');
  if (body && body.scrollTop > 0 && (e.target as HTMLElement).closest('.sb')) return;
  startY = e.touches[0].clientY; dy = 0; dragging = true;
  panel.value!.style.transition = 'none';
}
function onMove(e: TouchEvent) {
  if (!dragging) return;
  dy = Math.max(0, e.touches[0].clientY - startY);
  panel.value!.style.transform = `translateY(${dy}px)`;
}
function onEnd() {
  if (!dragging) return;
  dragging = false;
  panel.value!.style.transition = '';
  panel.value!.style.transform = '';
  if (dy > 110) emit('close');
}

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') emit('close'); }
watch(() => props.open, (o) => {
  document.body.style.overflow = o ? 'hidden' : '';
  if (o) window.addEventListener('keydown', onKey); else window.removeEventListener('keydown', onKey);
}, { immediate: true });
onBeforeUnmount(() => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); });
</script>

<template>
  <Teleport to="body">
    <div class="sheet-backdrop" :class="{ show: open }" @click="emit('close')" />
    <section ref="panel" class="sheet" :class="{ show: open }" role="dialog" :aria-hidden="!open"
             @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd">
      <div class="grab" />
      <header class="sh">
        <div class="t">
          <div v-if="eyebrow" class="eyebrow">{{ eyebrow }}</div>
          <h2 v-if="title" class="display">{{ title }}</h2>
          <p v-if="sub" class="sum">{{ sub }}</p>
        </div>
        <button class="close" aria-label="Close" @click="emit('close')"><Icon name="close" :size="18" /></button>
      </header>
      <div class="sb"><slot /></div>
    </section>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; z-index: 100; background: var(--overlay); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity .25s var(--ease); }
.sheet-backdrop.show { opacity: 1; pointer-events: auto; }
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 101; max-width: var(--maxw); margin: 0 auto; max-height: 92dvh; background: var(--paper); border-radius: var(--r-xl) var(--r-xl) 0 0; box-shadow: var(--shadow-3); transform: translateY(104%); transition: transform .4s var(--ease); display: flex; flex-direction: column; }
.sheet.show { transform: none; }
.grab { width: 40px; height: 5px; border-radius: 3px; background: var(--line-2); margin: 10px auto 0; flex: none; }
.sh { padding: 12px var(--gutter) 10px; display: flex; align-items: flex-start; gap: 12px; flex: none; }
.sh .t { flex: 1; min-width: 0; }
.sh .eyebrow { margin-bottom: 4px; }
.sh h2 { font-size: 1.625rem; }
.sh .sum { font-size: 0.875rem; color: var(--ink-2); margin-top: 4px; }
.close { width: 36px; height: 36px; border-radius: 50%; background: var(--paper-2); display: grid; place-items: center; color: var(--ink-2); flex: none; }
:root[data-theme="dark"] .close { background: var(--card-2); }
.sb { overflow-y: auto; padding: 0 var(--gutter) calc(var(--sab) + 24px); -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
</style>
