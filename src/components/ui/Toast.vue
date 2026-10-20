<script setup lang="ts">
import { ref } from 'vue';

const msg = ref('');
const show = ref(false);
let t: number | undefined;

export interface ToastApi { (text: string): void }
function toast(text: string) {
  msg.value = text; show.value = true;
  clearTimeout(t); t = window.setTimeout(() => { show.value = false; }, 1800);
}
defineExpose({ toast });
</script>

<template>
  <div class="toast" :class="{ show }" role="status">{{ msg }}</div>
</template>

<style scoped>
.toast { position: fixed; left: 50%; bottom: calc(var(--tabbar) + var(--sab) + 24px); transform: translate(-50%, 16px); z-index: 200; padding: 10px 18px; border-radius: var(--r-pill); background: var(--fg); color: var(--bg); font-size: 13px; font-weight: 600; opacity: 0; transition: opacity .25s, transform .25s; pointer-events: none; white-space: nowrap; box-shadow: var(--sh-2); }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
</style>
