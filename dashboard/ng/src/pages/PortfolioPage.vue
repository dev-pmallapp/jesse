<template>
  <AppCard title="Portfolio">
    <p class="ng:text-muted ng:text-sm ng:mb-3">
      Portfolio backtesting is coming in step 2 - this placeholder calls the real
      <code>/portfolio/options</code> endpoint below to prove auth works end to end.
    </p>
    <Banner :message="error" tone="error" />
    <div v-if="summary" class="ng:text-sm ng:space-y-1">
      <p class="ng:m-0">Exchanges: {{ summary.exchanges.join(', ') || '-' }}</p>
      <p class="ng:m-0">Universes: {{ summary.universes.length }}</p>
      <p class="ng:m-0">Benchmarks: {{ summary.benchmarks.join(', ') || '-' }}</p>
    </div>
    <p v-else-if="!error" class="ng:text-muted ng:text-sm ng:m-0">Loading options...</p>
  </AppCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import { api } from '../api/client';

interface PortfolioOptionsResponse {
  exchanges?: string[];
  universes?: string[];
  benchmarks?: string[];
}

const summary = ref<{ exchanges: string[]; universes: string[]; benchmarks: string[] } | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await api<PortfolioOptionsResponse>('/portfolio/options', {});
    if (!res.ok) {
      error.value = 'Could not load backtest options from the server.';
      return;
    }
    summary.value = {
      exchanges: res.data.exchanges ?? [],
      universes: res.data.universes ?? [],
      benchmarks: res.data.benchmarks ?? [],
    };
  } catch {
    // api() already redirected to the login gate on a 401 - anything else reaching here
    // is a network-level failure (offline, DNS, CORS, ...).
    error.value = 'Could not reach the server.';
  }
});
</script>
