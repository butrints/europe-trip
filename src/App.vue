<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Toast from '@/components/ui/Toast.vue';
import { useTheme } from '@/composables/useTheme';
import { onToast } from '@/composables/useSheet';
import { startSync } from '@/composables/useSync';

useTheme();
startSync();
const toastEl = ref<InstanceType<typeof Toast> | null>(null);
onMounted(() => onToast((m) => toastEl.value?.toast(m)));
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <Toast ref="toastEl" />
</template>
