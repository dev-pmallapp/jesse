<template>
  <AppCard title="Industries">
    <ul class="ng:list-none ng:m-0 ng:p-0 ng:flex ng:flex-col ng:gap-2">
      <li v-for="row in industries" :key="row.industry">
        <button type="button" class="ng:w-full ng:text-left ng:bg-transparent ng:border-none ng:p-0 ng:cursor-pointer" @click="toggle(row.industry)">
          <div class="ng:flex ng:items-center ng:justify-between ng:text-[12px] ng:mb-1">
            <span :class="selected === row.industry ? 'ng:text-highlighted ng:font-medium' : 'ng:text-text'">{{ row.industry }}</span>
            <span class="ng:text-muted ng:tabular-nums">{{ row.count }} ({{ share(row.count) }}%)</span>
          </div>
          <div class="ng:bg-bg ng:border ng:border-border ng:rounded ng:h-2 ng:overflow-hidden">
            <div
              class="ng:h-full ng:transition-[width] ng:duration-300 ng:ease-out"
              :class="selected === row.industry ? 'ng:bg-primary' : 'ng:bg-accented'"
              :style="{ width: share(row.count) + '%' }"
            />
          </div>
        </button>
      </li>
      <li v-if="!industries.length" class="ng:text-muted ng:text-[12.5px]">No industry data.</li>
    </ul>
    <button
      v-if="selected"
      type="button"
      class="ng:bg-transparent ng:border-none ng:text-primary ng:text-[12px] ng:cursor-pointer ng:p-0 ng:mt-2.5"
      @click="$emit('select', null)"
    >
      Clear filter
    </button>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '../AppCard.vue';
import type { BasketIndustryCount } from '../../api/baskets';

const props = defineProps<{ industries: BasketIndustryCount[]; total: number; selected: string | null }>();
const emit = defineEmits<{ select: [string | null] }>();

function share(count: number): string {
  return props.total ? ((count / props.total) * 100).toFixed(1) : '0.0';
}

// Clicking the already-active industry clears the filter instead of re-selecting it -
// otherwise there'd be no way to get back to "all industries" except the separate
// "Clear filter" button below.
function toggle(industry: string): void {
  emit('select', props.selected === industry ? null : industry);
}
</script>
