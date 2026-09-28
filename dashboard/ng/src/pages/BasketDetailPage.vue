<template>
  <AppCard :title="`Basket: ${id ?? ''}`">
    <p class="ng:text-muted ng:text-sm ng:m-0">Basket detail is coming in step 2.</p>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '../components/AppCard.vue';

// Bound from the matched route's params (see router.ts's `basket-detail` pattern
// `/india/basket/:id`).
defineProps<{ id?: string }>();
</script>
