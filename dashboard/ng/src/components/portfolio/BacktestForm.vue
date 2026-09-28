<!--
  Config card for a new Portfolio backtest - target (Basket|Stocks), dates, capital,
  rebalance cadence, fee, benchmark, save toggle. Owns no network calls itself (the page
  does the fetching); this is presentational + local validation-error display around the
  `PortfolioFormState` it two-way-binds via `defineModel`.
-->
<template>
  <AppCard title="New backtest">
    <template #actions>
      <AppButton size="small" type="button" :disabled="loadingOptions" @click="$emit('reload-options')">
        Reload options
      </AppButton>
    </template>

    <div class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] ng:gap-x-4">
      <FormField label="Exchange" for-id="pf-exchange">
        <select id="pf-exchange" v-model="form.exchange" class="ng-input">
          <option v-for="ex in options?.exchanges ?? ['NSE', 'BSE']" :key="ex" :value="ex">{{ ex }}</option>
        </select>
      </FormField>
      <FormField label="Start date" for-id="pf-start-date">
        <input id="pf-start-date" v-model="form.start_date" type="date" class="ng-input" />
      </FormField>
      <FormField label="Finish date" for-id="pf-finish-date">
        <input id="pf-finish-date" v-model="form.finish_date" type="date" class="ng-input" />
      </FormField>
      <FormField label="Capital (INR)" for-id="pf-capital">
        <input id="pf-capital" v-model.number="form.capital" type="number" min="0" step="1" class="ng-input" />
      </FormField>
      <FormField label="Rebalance every N days" for-id="pf-rebalance-days">
        <input id="pf-rebalance-days" v-model.number="form.rebalance_days" type="number" min="1" step="1" class="ng-input" />
      </FormField>
      <FormField label="Fee (fraction, e.g. 0.001)" for-id="pf-fee">
        <input id="pf-fee" v-model.number="form.fee" type="number" min="0" step="0.0001" class="ng-input" />
      </FormField>
      <FormField label="Benchmark (optional)" for-id="pf-benchmark">
        <input id="pf-benchmark" v-model="form.benchmark" type="text" list="pf-benchmark-list" placeholder="e.g. NIFTY200" class="ng-input" />
        <datalist id="pf-benchmark-list">
          <option v-for="b in options?.benchmarks ?? []" :key="b" :value="b" />
        </datalist>
      </FormField>
    </div>

    <FormField label="Target">
      <div class="ng:flex ng:gap-1.5 ng:mb-2.5">
        <AppButton
          type="button"
          size="small"
          :variant="form.mode === 'basket' ? 'primary' : 'default'"
          @click="form.mode = 'basket'"
        >
          Basket
        </AppButton>
        <AppButton
          type="button"
          size="small"
          :variant="form.mode === 'stocks' ? 'primary' : 'default'"
          @click="form.mode = 'stocks'"
        >
          Stocks
        </AppButton>
      </div>

      <select v-if="form.mode === 'basket'" v-model="form.universe" class="ng-input">
        <option v-if="!options?.universes?.length" value="">No baskets available</option>
        <option v-for="name in options?.universes ?? []" :key="name" :value="name">{{ name }}</option>
      </select>
      <textarea
        v-else
        v-model="form.symbolsText"
        placeholder="RELIANCE, TCS, INFY ..."
        class="ng-input ng:min-h-14 ng:font-mono ng:resize-y"
      />
    </FormField>

    <FormField>
      <label class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:text-text">
        <input v-model="form.save" type="checkbox" />
        Save this run
      </label>
    </FormField>

    <div class="ng:flex ng:items-center ng:gap-2.5">
      <AppButton variant="primary" type="button" :disabled="running" @click="$emit('run')">Run backtest</AppButton>
      <span
        v-if="running"
        class="ng:inline-block ng:w-3.5 ng:h-3.5 ng:rounded-full ng:border-2 ng:border-border ng:border-t-primary ng:animate-spin"
      />
    </div>
    <Banner :message="error" tone="error" />
  </AppCard>
</template>

<script setup lang="ts">
import AppButton from '../AppButton.vue';
import AppCard from '../AppCard.vue';
import Banner from '../Banner.vue';
import FormField from '../FormField.vue';
import type { PortfolioFormState, PortfolioOptions } from '../../api/portfolio';

defineProps<{
  options: PortfolioOptions | null;
  loadingOptions: boolean;
  running: boolean;
  error: string | null;
}>();

defineEmits<{ 'reload-options': []; run: [] }>();

const form = defineModel<PortfolioFormState>({ required: true });
</script>

<style scoped>
/* Shared native-input look for this card only - matches FormField's own text-only
   styling; every other component on this page uses Tailwind utilities exclusively, but
   a single class here is less repetitive than the same eight utilities on every input.
   Prefixed classes (`ng:*`) so it stays namespaced alongside the rest of this build's
   Tailwind output - see styles/ng.css's "why the ng: prefix" note. */
.ng-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--ng-color-border);
  border-radius: 0.375rem;
  background: var(--ng-color-bg);
  color: var(--ng-color-text);
  font-size: 13px;
}
</style>
