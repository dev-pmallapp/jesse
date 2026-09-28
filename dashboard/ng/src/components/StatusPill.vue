<template>
  <span
    class="ng:inline-block ng:px-2 ng:py-0.5 ng:rounded-full ng:text-[11px] ng:border ng:border-border"
    :class="toneClass"
  >
    <slot>{{ status }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status?: string;
  // Explicit tone overrides the status-string inference below (e.g. a session status
  // vocabulary that doesn't match the 'running'/'done'/'error' defaults this infers).
  tone?: 'running' | 'done' | 'error' | 'default';
}>();

function inferTone(status?: string): 'running' | 'done' | 'error' | 'default' {
  if (!status) return 'default';
  if (status === 'running') return 'running';
  if (status === 'done' || status === 'completed') return 'done';
  if (status === 'error' || status === 'cancelled' || status === 'failed') return 'error';
  return 'default';
}

const toneClass = computed(() => {
  const tone = props.tone ?? inferTone(props.status);
  if (tone === 'running') return 'ng:text-primary ng:border-primary';
  if (tone === 'done') return 'ng:text-success ng:border-success';
  if (tone === 'error') return 'ng:text-error ng:border-error';
  return '';
});
</script>
