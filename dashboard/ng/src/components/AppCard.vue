<template>
  <div class="ng:bg-elevated ng:border ng:border-border ng:rounded-lg ng:p-3.5 ng:mb-3.5">
    <div v-if="title || $slots.actions" class="ng:flex ng:items-center ng:justify-between ng:gap-2.5 ng:mb-2.5 ng:flex-wrap">
      <h2 v-if="title" class="ng:text-[15px] ng:font-medium ng:text-highlighted ng:m-0">{{ title }}</h2>
      <div v-if="$slots.actions" class="ng:flex ng:items-center ng:gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>
