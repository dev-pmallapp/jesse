<!--
  The "New scan" form - target (basket/stocks), strategies, timeframe, train/test
  windows and the fixed/optimize run parameters. Ports every field
  universe_scan_page.template.js's SKELETON_HTML collected (see that file for the exact
  set) onto FormField + plain inputs styled with this app's `ng:` tokens instead of that
  template's own scoped <style> sheet.
-->
<template>
  <div>
    <FormField label="Target">
      <ScanTargetPicker :form="form" :universes="options.universes" :baskets="baskets" />
    </FormField>

    <FormField label="Strategies">
      <div class="ng:flex ng:items-center ng:justify-between ng:gap-2 ng:mb-1.5">
        <span />
        <div class="ng:flex ng:gap-1.5">
          <AppButton size="small" @click="form.selectedStrategies = [...options.strategies]">Select all</AppButton>
          <AppButton size="small" @click="form.selectedStrategies = []">Select none</AppButton>
        </div>
      </div>
      <div
        v-if="options.strategies.length"
        class="ng:flex ng:flex-wrap ng:gap-x-3.5 ng:gap-y-1.5 ng:max-h-40 ng:overflow-y-auto ng:border ng:border-border ng:rounded-md ng:p-2"
      >
        <label v-for="name in options.strategies" :key="name" class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:whitespace-nowrap ng:m-0">
          <input type="checkbox" :value="name" :checked="form.selectedStrategies.includes(name)" @change="toggleStrategy(name)" />
          {{ name }}
        </label>
      </div>
      <p v-else class="ng:text-muted ng:text-sm ng:m-0">No strategies found under strategies/.</p>
    </FormField>

    <div class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] ng:gap-x-4 ng:gap-y-1">
      <FormField label="Timeframe">
        <select v-model="form.timeframe" :class="inputClass">
          <option v-for="tf in options.timeframes" :key="tf" :value="tf">{{ tf }}</option>
        </select>
      </FormField>
      <FormField label="Warm-up candles">
        <input v-model.number="form.warm_up_candles" type="number" min="0" :class="inputClass" />
      </FormField>
      <FormField label="Starting balance (INR)">
        <input v-model.number="form.balance" type="number" min="0" :class="inputClass" />
      </FormField>
      <FormField label="Fee (fraction)">
        <input v-model.number="form.fee" type="number" min="0" step="0.0001" :class="inputClass" />
      </FormField>
      <FormField label="CPU cores (optimize)">
        <input
          type="number"
          min="1"
          :max="options.max_cpu_cores"
          :placeholder="`auto (~${options.defaults.cpu_cores})`"
          :value="form.cpu_cores ?? ''"
          :class="inputClass"
          @input="onCpuCoresInput"
        />
      </FormField>
      <FormField label="Min train days">
        <input v-model.number="form.min_train_days" type="number" min="1" :class="inputClass" />
      </FormField>
    </div>

    <div class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] ng:gap-x-4 ng:gap-y-1">
      <FormField label="Data start (warm-up source)">
        <input v-model="form.data_start" type="date" :class="inputClass" />
      </FormField>
      <FormField label="Train start">
        <input v-model="form.train_start" type="date" :class="inputClass" />
      </FormField>
      <FormField label="Train finish">
        <input v-model="form.train_finish" type="date" :class="inputClass" />
      </FormField>
      <FormField label="Test start">
        <input v-model="form.test_start" type="date" :class="inputClass" />
      </FormField>
      <FormField label="Test finish">
        <input v-model="form.test_finish" type="date" :class="inputClass" />
      </FormField>
    </div>

    <div class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] ng:gap-x-4 ng:gap-y-1">
      <label class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:mb-2.5">
        <input v-model="form.run_fixed" type="checkbox" />
        Run fixed (default hyperparameters)
      </label>
      <label class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:mb-2.5">
        <input v-model="form.run_optimize" type="checkbox" />
        Run optimize (per stock)
      </label>
      <label class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:mb-2.5">
        <input v-model="form.import_candles" type="checkbox" />
        Import/refresh candles first
      </label>
    </div>

    <div v-if="form.run_optimize" class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] ng:gap-x-4 ng:gap-y-1">
      <FormField label="Trials per hyperparameter">
        <input v-model.number="form.trials_per_hp" type="number" min="1" :class="inputClass" />
      </FormField>
      <FormField label="Optimal total (trade-count normalisation)">
        <input v-model.number="form.optimal_total" type="number" min="1" :class="inputClass" />
      </FormField>
      <FormField label="Objective function">
        <select v-model="form.objective_function" :class="inputClass">
          <option v-for="fn in OBJECTIVE_FUNCTIONS" :key="fn" :value="fn">{{ fn }}</option>
        </select>
      </FormField>
    </div>

    <div class="ng:flex ng:items-center ng:gap-2.5 ng:mt-1">
      <AppButton variant="primary" :disabled="starting" @click="$emit('start')">
        {{ starting ? 'Starting...' : 'Start scan' }}
      </AppButton>
      <span v-if="startError" class="ng:text-error ng:text-[13px]">{{ startError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '../AppButton.vue';
import FormField from '../FormField.vue';
import ScanTargetPicker from './ScanTargetPicker.vue';
import type { Basket, ScanFormState, ScanOptions } from '../../api/scan';

const props = defineProps<{
  form: ScanFormState;
  options: ScanOptions;
  baskets: Basket[];
  starting: boolean;
  startError: string | null;
}>();

defineEmits<{ start: [] }>();

// Not part of /options (unlike timeframes/universes/strategies) - the backend accepts
// any string and only fitness.py actually interprets it, so this list is a fixed UI
// convenience matching universe_scan_page.template.js's <select> rather than a value
// fetched from the server.
const OBJECTIVE_FUNCTIONS = ['sharpe', 'calmar', 'sortino', 'omega'];

const inputClass =
  'ng:w-full ng:border ng:border-border ng:rounded-md ng:bg-bg ng:text-text ng:px-2 ng:py-1.5 ng:text-[13px]';

function toggleStrategy(name: string): void {
  const i = props.form.selectedStrategies.indexOf(name);
  if (i === -1) props.form.selectedStrategies.push(name);
  else props.form.selectedStrategies.splice(i, 1);
}

// cpu_cores is nullable (null = "let the server default it") - a plain v-model.number
// would coerce an emptied field to NaN instead of null, so this field manages the
// string<->null translation by hand.
function onCpuCoresInput(e: Event): void {
  const raw = (e.target as HTMLInputElement).value;
  props.form.cpu_cores = raw === '' ? null : Number(raw);
}
</script>
