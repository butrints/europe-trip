<script setup lang="ts">
import type { OperatorKey, StepMode } from '@/types/trip';
defineProps<{ mode: StepMode; line?: string; operator?: OperatorKey }>();
const label: Record<StepMode, string> = { walk: 'Walk', tram: 'Tram', bus: 'Bus', train: 'Train', metro: 'Metro', ferry: 'Ferry', plane: 'Flight', taxi: 'Taxi' };
</script>

<template>
  <span class="line" :class="[operator ?? mode]">{{ line ?? label[mode] }}</span>
</template>
