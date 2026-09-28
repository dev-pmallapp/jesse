<!--
  Universe Scan, redesigned around baskets/stocks: "run a strategy on every stock in a
  basket and rank the results" - ports
  jesse/dashboard_patches/universe_scan_page.template.js's full behaviour (options,
  start, poll, cancel, sessions, CSV export) onto this app's typed component/API split.
  See src/api/scan.ts and src/components/scan/* for the pieces.
-->
<template>
  <div class="ng:space-y-3.5">
    <AppCard title="New scan">
      <template #actions>
        <AppButton size="small" @click="loadOptions">Reload options</AppButton>
      </template>
      <p class="ng:text-muted ng:text-sm ng:mb-3 ng:mt-0">
        Run a strategy on every stock in a basket - or a hand-picked list - and rank the results
        against each stock's own buy &amp; hold.
      </p>
      <Banner :message="optionsError" tone="error" />
      <ScanRunForm
        v-if="options"
        :form="form"
        :options="options"
        :baskets="baskets"
        :starting="starting"
        :start-error="startError"
        @start="onStart"
      />
      <p v-else-if="!optionsError" class="ng:text-muted ng:text-sm ng:m-0">Loading options...</p>
    </AppCard>

    <ScanProgressCard v-if="session && session.status === 'running'" :session="session" @cancel="onCancel" />

    <ScanResultsPanel v-if="session" :session="session" />

    <AppCard title="Sessions">
      <template #actions>
        <AppButton size="small" @click="loadSessions">Refresh</AppButton>
      </template>
      <Banner :message="sessionsError" tone="error" />
      <ScanSessionsPanel :sessions="sessions" @open="onOpenSession" @delete="onDeleteSession" />
    </AppCard>

    <p class="ng:text-muted ng:text-[11px] ng:text-center ng:mt-1">
      Universe scan is a research tool - past-window backtests, not a live trading recommendation.
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import ScanProgressCard from '../components/scan/ScanProgressCard.vue';
import ScanResultsPanel from '../components/scan/ScanResultsPanel.vue';
import ScanRunForm from '../components/scan/ScanRunForm.vue';
import ScanSessionsPanel from '../components/scan/ScanSessionsPanel.vue';
import { formatServerErrorMessage } from '../api/client';
import {
  applyDefaults,
  buildStartRequest,
  cancelScan,
  defaultFormState,
  deleteScan,
  fetchBaskets,
  fetchScanOptions,
  fetchSession,
  fetchSessions,
  startScan,
  validateStartForm,
  type Basket,
  type ScanFormState,
  type ScanOptions,
  type ScanSession,
  type ScanSessionSummary,
} from '../api/scan';
import { useNgRoute } from '../router';

// Same poll cadence as the old dashboard_patches template (openSession's setInterval) -
// frequent enough to feel live for a scan that can run for hours across an entire
// basket, without hammering the server for a job that only advances progress once per
// (strategy, stock) unit.
const POLL_INTERVAL_MS = 2000;

const route = useNgRoute();

const options = ref<ScanOptions | null>(null);
const baskets = ref<Basket[]>([]);
const optionsError = ref<string | null>(null);

const form = reactive<ScanFormState>(defaultFormState());
const starting = ref(false);
const startError = ref<string | null>(null);

const session = ref<ScanSession | null>(null);
const sessions = ref<ScanSessionSummary[]>([]);
const sessionsError = ref<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function loadSessionOnce(id: string): Promise<void> {
  try {
    const res = await fetchSession(id);
    if (!res.ok) return;
    session.value = res.data;
    if (res.data.status !== 'running') stopPolling();
  } catch {
    // A transient network error just waits for the next poll tick rather than
    // surfacing a banner on every dropped beat.
  }
}

function openSession(id: string): void {
  stopPolling();
  void loadSessionOnce(id);
  pollTimer = setInterval(() => void loadSessionOnce(id), POLL_INTERVAL_MS);
}

// A basket id from `?basket=` (e.g. deep-linked from the Baskets page) maps to a
// universe *name* via /baskets/list - applied only once both /options (the allowed
// universe names) and /baskets/list (the id->name lookup) have loaded, so it can never
// race a still-empty `baskets`/`options.universes`.
function preselectBasketFromQuery(): void {
  const basketId = route.value.query.basket;
  if (!basketId || !options.value) return;
  const universeName = baskets.value.find((b) => b.id === basketId)?.name ?? basketId;
  if (!options.value.universes.includes(universeName)) return;
  form.mode = 'basket';
  form.selectedUniverses = [universeName];
}

async function loadOptions(): Promise<void> {
  optionsError.value = null;
  try {
    const res = await fetchScanOptions(form.exchange);
    if (!res.ok) {
      optionsError.value = 'Could not load scan options from the server.';
      return;
    }
    options.value = res.data;
    applyDefaults(form, res.data);
    preselectBasketFromQuery();
  } catch {
    optionsError.value = 'Could not reach the server.';
  }
}

async function loadBaskets(): Promise<void> {
  try {
    const res = await fetchBaskets();
    if (res.ok) baskets.value = res.data.baskets;
  } catch {
    // Basket names/member counts are a nice-to-have for the target picker's labels -
    // options.universes alone is still enough to run a scan, so this fails silently.
  }
}

async function loadSessions(): Promise<void> {
  sessionsError.value = null;
  try {
    const res = await fetchSessions();
    if (!res.ok) {
      sessionsError.value = 'Could not load past sessions from the server.';
      return;
    }
    sessions.value = res.data.sessions;
  } catch {
    sessionsError.value = 'Could not reach the server.';
  }
}

async function onStart(): Promise<void> {
  startError.value = null;
  const validationError = validateStartForm(form);
  if (validationError) {
    startError.value = validationError;
    return;
  }
  // Guards against a double-click racing the server's own check-then-create lock
  // (storage.start_lock()) - not strictly required for correctness, but avoids firing a
  // second, guaranteed-409 request while the first is in flight.
  starting.value = true;
  try {
    const res = await startScan(buildStartRequest(form));
    if (!res.ok) {
      startError.value = formatServerErrorMessage(res.data) ?? 'Failed to start scan.';
      return;
    }
    openSession(res.data.id);
    void loadSessions();
  } catch {
    startError.value = 'Could not reach the server.';
  } finally {
    starting.value = false;
  }
}

async function onCancel(): Promise<void> {
  if (!session.value) return;
  try {
    await cancelScan(session.value.id);
  } catch {
    startError.value = 'Could not cancel the scan. Please try again.';
  }
}

function onOpenSession(id: string): void {
  openSession(id);
}

async function onDeleteSession(id: string): Promise<void> {
  try {
    const res = await deleteScan(id);
    if (!res.ok) {
      window.alert(formatServerErrorMessage(res.data) ?? 'Could not delete.');
      return;
    }
    if (session.value?.id === id) {
      stopPolling();
      session.value = null;
    }
    void loadSessions();
  } catch {
    // A network-level failure (as opposed to the `!res.ok` branch above, a
    // server-level failure) - alert() rather than the page-level error banner,
    // matching the old template's own equivalent handler.
    window.alert(`Could not delete session ${id}: could not reach the server.`);
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadBaskets()]);
  // Baskets may have loaded after options applied its own preselect attempt inside
  // loadOptions (Promise.all has no ordering guarantee) - re-run now that both are settled.
  preselectBasketFromQuery();
  void loadSessions();
});

// Remounting this route (navigate away and back) must never leak a stale polling timer
// from a previous mount - App.vue's `<component :is>` fully unmounts this page on route
// change, so this is the only place that cleanup can happen.
onBeforeUnmount(stopPolling);
</script>
