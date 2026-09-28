<template>
  <div class="ng:mb-2.5">
    <label v-if="label" :for="forId" class="ng:block ng:text-xs ng:text-muted ng:mb-1">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string; forId?: string }>();
</script>
