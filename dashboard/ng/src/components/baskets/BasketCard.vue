<template>
  <button
    type="button"
    class="ng:text-left ng:bg-elevated ng:border ng:border-border ng:rounded-lg ng:p-3 ng:cursor-pointer ng:hover:border-primary ng:transition-colors ng:w-full"
    @click="$emit('click')"
  >
    <div class="ng:flex ng:items-start ng:justify-between ng:gap-2 ng:mb-2">
      <h3 class="ng:text-[13.5px] ng:font-semibold ng:text-highlighted ng:m-0">{{ basket.name }}</h3>
      <StatusPill :status="basket.kind" tone="default">{{ basket.kind === 'mf' ? 'MF' : 'Index' }}</StatusPill>
    </div>
    <dl class="ng:grid ng:grid-cols-[auto_1fr] ng:gap-x-2 ng:gap-y-1 ng:text-[12px] ng:m-0">
      <dt class="ng:text-muted">Members</dt>
      <dd class="ng:text-text ng:tabular-nums ng:m-0">{{ basket.member_count ?? '-' }}</dd>
      <dt class="ng:text-muted">Snapshot</dt>
      <dd class="ng:text-text ng:m-0">{{ basket.snapshot_date ?? 'not fetched yet' }}</dd>
      <dt class="ng:text-muted">Benchmark</dt>
      <dd class="ng:text-text ng:m-0">{{ basket.benchmark }}</dd>
    </dl>
  </button>
</template>

<script setup lang="ts">
import StatusPill from '../StatusPill.vue';
import type { BasketSummary } from '../../api/baskets';

defineProps<{ basket: BasketSummary }>();
defineEmits<{ click: [] }>();
</script>
