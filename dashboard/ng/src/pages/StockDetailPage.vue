<template>
  <AppCard :title="`Stock: ${symbol ?? ''}`">
    <p class="ng:text-muted ng:text-sm ng:m-0">Stock detail is coming in step 2.</p>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '../components/AppCard.vue';

// Bound from the matched route's params (see router.ts's `stock-detail` pattern
// `/india/stock/:symbol`, e.g. `NSE:RELIANCE`).
defineProps<{ symbol?: string }>();
</script>
