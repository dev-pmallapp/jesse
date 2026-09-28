<template>
  <button
    type="button"
    class="ng:cursor-pointer ng:border ng:rounded-md ng:text-[13px] ng:disabled:opacity-50 ng:disabled:cursor-not-allowed"
    :class="classes"
    :disabled="disabled"
    @click="(e: MouseEvent) => $emit('click', e)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'danger' | 'link';
    size?: 'default' | 'small';
    disabled?: boolean;
  }>(),
  { variant: 'default', size: 'default', disabled: false },
);

defineEmits<{ click: [MouseEvent] }>();

const classes = computed(() => {
  const c: string[] = [];
  if (props.variant === 'primary') c.push('ng:bg-primary ng:text-bg ng:border-primary ng:font-semibold');
  else if (props.variant === 'danger') c.push('ng:bg-error ng:text-bg ng:border-error');
  else if (props.variant === 'link') c.push('ng:bg-transparent ng:border-none ng:text-primary ng:underline ng:p-0');
  else c.push('ng:bg-elevated ng:text-text ng:border-border');

  if (props.variant !== 'link') {
    c.push(props.size === 'small' ? 'ng:px-2.5 ng:py-1 ng:text-xs' : 'ng:px-3.5 ng:py-1.5');
  }
  return c;
});
</script>
