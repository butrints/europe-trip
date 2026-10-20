<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ src?: string; alt?: string }>();
const loaded = ref(false);
const failed = ref(false);
</script>

<template>
  <div class="img">
    <img v-if="src && !failed" :src="src" :alt="alt ?? ''" loading="lazy" decoding="async" :class="{ loaded }" @load="loaded = true" @error="failed = true" />
    <div v-if="!src || failed || !loaded" class="ph"><slot /></div>
  </div>
</template>

<style scoped>
.img { position: relative; width: 100%; height: 100%; overflow: hidden; background: linear-gradient(135deg, var(--paper-2), var(--card-2)); }
img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .5s var(--ease); }
img.loaded { opacity: 1; }
.ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--ink-3); }
</style>
