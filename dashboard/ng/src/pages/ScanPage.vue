<template>
  <AppCard title="Scan">
    <p class="ng:text-muted ng:text-sm ng:mb-3">
      Universe Scan is coming in step 2 - this placeholder calls the real
      <code>/universe-scan/options</code> endpoint below to prove auth works end to end.
    </p>
    <Banner :message="error" tone="error" />
    <div v-if="summary" class="ng:text-sm ng:space-y-1">
      <p class="ng:m-0">Timeframes: {{ summary.timeframes.join(', ') || '-' }}</p>
      <p class="ng:m-0">Universes: {{ summary.universes.length }}</p>
      <p class="ng:m-0">Strategies: {{ summary.strategies.length }}</p>
    </div>
    <p v-else-if="!error" class="ng:text-muted ng:text-sm ng:m-0">Loading options...</p>
  </AppCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import { api } from '../api/client';

interface ScanOptionsResponse {
  timeframes?: string[];
  universes?: string[];
  strategies?: string[];
}

const summary = ref<{ timeframes: string[]; universes: string[]; strategies: string[] } | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // Same default exchange the old dashboard_patches template started with (see
    // universe_scan_page.template.js's loadOptions).
    const res = await api<ScanOptionsResponse>('/universe-scan/options', { exchange: 'NSE' });
    if (!res.ok) {
      error.value = 'Could not load scan options from the server.';
      return;
    }
    summary.value = {
      timeframes: res.data.timeframes ?? [],
      universes: res.data.universes ?? [],
      strategies: res.data.strategies ?? [],
    };
  } catch {
    // api() already redirected to the login gate on a 401 - anything else reaching here
    // is a network-level failure (offline, DNS, CORS, ...).
    error.value = 'Could not reach the server.';
  }
});
</script>
