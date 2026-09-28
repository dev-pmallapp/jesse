<template>
  <div class="ng:bg-bg ng:border ng:border-border ng:rounded-md ng:h-4 ng:overflow-hidden">
    <div class="ng:bg-primary ng:h-full ng:transition-[width] ng:duration-300 ng:ease-out" :style="{ width: clampedPct + '%' }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ percent: number }>();
const clampedPct = computed(() => Math.max(0, Math.min(100, props.percent || 0)));
</script>
