<template>
  <AppCard title="Data coverage">
    <div class="ng:flex ng:items-center ng:justify-between ng:mb-1.5 ng:text-[12.5px]">
      <span class="ng:text-muted">{{ coverage.imported }} imported / {{ coverage.missing }} missing of {{ total }}</span>
      <span class="ng:tabular-nums ng:text-text">{{ pct.toFixed(0) }}%</span>
    </div>
    <ProgressBar :percent="pct" />

    <template v-if="coverage.missing">
      <button
        type="button"
        class="ng:bg-transparent ng:border-none ng:text-primary ng:text-[12.5px] ng:cursor-pointer ng:p-0 ng:mt-2.5"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Hide' : 'Show' }} {{ coverage.missing }} missing ticker{{ coverage.missing === 1 ? '' : 's' }}
      </button>
      <div v-if="expanded" class="ng:mt-2">
        <div class="ng:flex ng:flex-wrap ng:gap-1.5 ng:mb-2">
          <span
            v-for="t in coverage.missing_tickers"
            :key="t"
            class="ng:inline-block ng:px-1.5 ng:py-0.5 ng:rounded ng:border ng:border-border ng:text-[11.5px] ng:text-muted"
          >
            {{ t }}
          </span>
        </div>
        <p class="ng:text-[12px] ng:text-muted ng:m-0">
          Import these from
          <button
            type="button"
            class="ng:bg-transparent ng:border-none ng:text-primary ng:underline ng:p-0 ng:cursor-pointer ng:text-[12px]"
            @click="navigate('/candles')"
          >
            Candles
          </button>.
        </p>
      </div>
    </template>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppCard from '../AppCard.vue';
import ProgressBar from '../ProgressBar.vue';
import { useNgNavigate } from '../../router';
import type { BasketCoverage } from '../../api/baskets';

const props = defineProps<{ coverage: BasketCoverage }>();
const navigate = useNgNavigate();
const expanded = ref(false);

const total = computed(() => props.coverage.imported + props.coverage.missing);
const pct = computed(() => (total.value ? (props.coverage.imported / total.value) * 100 : 0));
</script>
