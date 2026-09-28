<template>
  <div v-if="message" class="ng:rounded-md ng:border ng:px-3 ng:py-2.5 ng:mb-3 ng:text-[13px]" :class="toneClass">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ message?: string | null; tone?: 'warn' | 'error' }>(), {
  message: null,
  tone: 'warn',
});

const toneClass = computed(() =>
  props.tone === 'error'
    ? 'ng:border-error ng:text-error ng:bg-error/10'
    : 'ng:border-warning ng:text-text ng:bg-warning/15',
);
</script>
