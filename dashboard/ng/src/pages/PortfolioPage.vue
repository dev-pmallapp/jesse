<!--
  Portfolio: backtest a basket as one equal-weight portfolio, rebalanced periodically,
  against a benchmark. Ports every behaviour of the old hand-written
  `jesse/dashboard_patches/portfolio_page.template.js` (form + validation, /backtest,
  422 missing-candles handling, results, CSV exports, saved runs) onto
  `research.portfolio_rebalance()`'s result shape (see api/portfolio.ts), redesigned
  around baskets: a Basket|Stocks segmented target instead of a bare "universe" picker,
  KPI tiles, and a rebalance timeline instead of flat metrics/rebalances tables.
-->
<template>
  <div>
    <AppCard title="Portfolio">
      <p class="ng:text-muted ng:text-sm ng:m-0">
        Backtest a basket as one equal-weight portfolio, rebalanced periodically, against a benchmark.
      </p>
    </AppCard>

    <Banner :message="optionsError" tone="error" />

    <BacktestForm
      v-model="form"
      :options="options"
      :loading-options="loadingOptions"
      :running="running"
      :error="runError"
      @reload-options="loadOptions"
      @run="onRunClick"
    />

    <AppCard v-if="missingCandles" title="Missing candles">
      <p class="ng:text-sm ng:mb-2">{{ missingCandles.message }}</p>
      <ul class="ng:text-sm ng:mb-2 ng:pl-5 ng:list-disc">
        <li v-for="s in missingCandles.missing_symbols" :key="s">{{ displayTicker(s, form.exchange) }}</li>
      </ul>
      <p class="ng:text-muted ng:text-sm ng:mb-3">
        Import the missing candles first, then re-run this backtest.
      </p>
      <AppButton type="button" @click="navigate('/candles/')">Go to Import Candles</AppButton>
    </AppCard>

    <template v-if="result">
      <AppCard title="Result">
        <template #actions>
          <AppButton size="small" type="button" @click="downloadEquityCsv(result)">Download equity.csv</AppButton>
          <AppButton size="small" type="button" @click="downloadTradesCsv(result)">Download trades.csv</AppButton>
        </template>

        <Banner
          v-if="result.survivorship_warning"
          tone="warn"
          message="Survivorship bias warning: this basket was resolved using TODAY's index membership over a past window - absolute returns are inflated by construction. Compare against buy & hold, not zero."
        />

        <KpiTiles :result="result" />

        <h3 class="ng:text-[11px] ng:uppercase ng:tracking-wide ng:text-muted ng:mb-1.5 ng:mt-4">Equity curve</h3>
        <EquityChart :series="chartSeries" :tick-dates-ms="tickDatesMs" />

        <div v-if="unaffordableEntries.length" class="ng:mt-2">
          <h3 class="ng:text-[11px] ng:uppercase ng:tracking-wide ng:text-muted ng:mb-1.5">
            Never held (1 share &gt; target)
          </h3>
          <ul class="ng:text-[12.5px] ng:text-muted ng:pl-5 ng:list-disc ng:m-0">
            <li v-for="[symbol, price] in unaffordableEntries" :key="symbol">
              {{ displayTicker(symbol, result.config.exchange) }} ({{ fmtINR(price) }})
            </li>
          </ul>
        </div>
      </AppCard>

      <AppCard title="Holdings over time">
        <RebalanceTimeline
          :rebalances="result.rebalances"
          :final-holdings="result.final_holdings"
          :exchange="result.config.exchange"
        />
        <p class="ng:text-muted ng:text-[11px] ng:mt-3 ng:mb-0">
          Per-rebalance holdings aren't available from the API - only the final holdings, shown under the most
          recent rebalance above.
        </p>
      </AppCard>
    </template>

    <SavedRunsPanel :runs="runs" @load="onLoadRun" @delete="onDeleteRun" @refresh="loadRuns" />

    <p class="ng:text-muted ng:text-[11px] ng:text-center ng:mt-2">
      Equal-weight rebalance backtest is a research tool - past-window results, not a live trading recommendation.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import EquityChart, { type EquitySeries } from '../components/EquityChart.vue';
import BacktestForm from '../components/portfolio/BacktestForm.vue';
import KpiTiles from '../components/portfolio/KpiTiles.vue';
import RebalanceTimeline from '../components/portfolio/RebalanceTimeline.vue';
import SavedRunsPanel from '../components/portfolio/SavedRunsPanel.vue';
import { formatServerErrorMessage } from '../api/client';
import {
  buildBacktestPayload,
  deletePortfolioRun,
  downloadEquityCsv,
  downloadTradesCsv,
  fetchBasketsList,
  fetchPortfolioOptions,
  fetchPortfolioRun,
  fetchPortfolioRuns,
  isMissingCandlesResponse,
  runPortfolioBacktest,
  validateBacktestPayload,
  type MissingCandlesResponse,
  type PortfolioBacktestResponse,
  type PortfolioBacktestResult,
  type PortfolioFormState,
  type PortfolioOptions,
  type RunSummary,
} from '../api/portfolio';
import { displayTicker, fmtINR, parseDateMs } from '../utils/format';
import { useNgNavigate, useNgRoute } from '../router';

const route = useNgRoute();
const navigate = useNgNavigate();

function defaultForm(): PortfolioFormState {
  return {
    exchange: 'NSE',
    mode: 'basket',
    universe: '',
    symbolsText: '',
    start_date: '',
    finish_date: '',
    capital: 15_000,
    rebalance_days: 15,
    fee: 0.001,
    benchmark: '',
    save: true,
  };
}

const form = ref<PortfolioFormState>(defaultForm());
const options = ref<PortfolioOptions | null>(null);
const loadingOptions = ref(false);
const optionsError = ref<string | null>(null);

const runError = ref<string | null>(null);
const running = ref(false);
const result = ref<PortfolioBacktestResult | null>(null);
const currentRunId = ref<string | null>(null);
const missingCandles = ref<MissingCandlesResponse | null>(null);

const runs = ref<RunSummary[]>([]);

function applyDefaults(defaults: PortfolioOptions['defaults']): void {
  form.value.exchange = defaults.exchange || form.value.exchange;
  form.value.start_date = defaults.start_date || form.value.start_date;
  form.value.finish_date = defaults.finish_date || form.value.finish_date;
  if (defaults.capital !== undefined && defaults.capital !== null) form.value.capital = defaults.capital;
  if (defaults.rebalance_days !== undefined && defaults.rebalance_days !== null) form.value.rebalance_days = defaults.rebalance_days;
  if (defaults.fee !== undefined && defaults.fee !== null) form.value.fee = defaults.fee;
  form.value.benchmark = defaults.benchmark || '';
  if (defaults.universe) {
    form.value.mode = 'basket';
    form.value.universe = defaults.universe;
  } else if (defaults.symbols && defaults.symbols.length) {
    form.value.mode = 'stocks';
    form.value.symbolsText = defaults.symbols.join(', ');
  }
}

// Deep-link support: `/india/portfolio?basket=<id>` (from BasketsPage/BasketDetailPage)
// preselects that basket in Basket mode - `id` is the slug `baskets_controller` derives
// from the universe name, so it's resolved against `/baskets/list`, not guessed here.
async function applyBasketQueryParam(): Promise<void> {
  const basketId = route.value.query.basket;
  if (!basketId) return;
  const res = await fetchBasketsList();
  if (!res.ok) return;
  const match = res.data.baskets.find((b) => b.id === basketId);
  if (match) {
    form.value.mode = 'basket';
    form.value.universe = match.name;
  }
}

async function loadOptions(): Promise<void> {
  loadingOptions.value = true;
  optionsError.value = null;
  try {
    const res = await fetchPortfolioOptions();
    if (!res.ok) {
      optionsError.value = 'Could not load backtest options from the server.';
      return;
    }
    options.value = res.data;
    applyDefaults(res.data.defaults);
  } catch {
    // api() already redirected to the login gate on a 401 - anything else reaching here
    // is a network-level failure (offline, DNS, CORS, ...).
    optionsError.value = 'Could not reach the server.';
  } finally {
    loadingOptions.value = false;
  }
}

async function loadRuns(): Promise<void> {
  try {
    const res = await fetchPortfolioRuns();
    if (res.ok) runs.value = res.data.runs;
  } catch {
    // Saved runs are a secondary panel - a failure here shouldn't block the rest of the
    // page, so it's silent rather than stealing the shared run-error banner.
  }
}

async function onRunClick(): Promise<void> {
  runError.value = null;
  missingCandles.value = null;
  const payload = buildBacktestPayload(form.value);
  const validationError = validateBacktestPayload(payload);
  if (validationError) {
    runError.value = validationError;
    return;
  }

  running.value = true;
  try {
    const res = await runPortfolioBacktest(payload);
    if (res.ok) {
      const data = res.data as PortfolioBacktestResponse;
      result.value = data.result;
      currentRunId.value = data.id;
      loadRuns();
      return;
    }
    if (res.status === 422 && isMissingCandlesResponse(res.data)) {
      missingCandles.value = res.data;
      result.value = null;
      return;
    }
    runError.value = formatServerErrorMessage(res.data) || 'Backtest failed.';
  } catch {
    runError.value = 'Could not reach the server.';
  } finally {
    running.value = false;
  }
}

async function onLoadRun(id: string): Promise<void> {
  try {
    const res = await fetchPortfolioRun(id);
    if (!res.ok) {
      window.alert(formatServerErrorMessage(res.data) || 'Could not load run.');
      return;
    }
    result.value = res.data.result;
    currentRunId.value = res.data.id;
    missingCandles.value = null;
  } catch {
    window.alert('Could not reach the server.');
  }
}

async function onDeleteRun(id: string): Promise<void> {
  try {
    const res = await deletePortfolioRun(id);
    if (res.ok) {
      loadRuns();
      if (currentRunId.value === id) currentRunId.value = null;
    } else {
      window.alert(res.data.message || 'Could not delete.');
    }
  } catch {
    // A network-level failure, as opposed to the `res.ok === false` branch above (a
    // server-level failure) - alert() rather than the page-level error banner, matching
    // the old template's equivalent handler.
    window.alert('Could not delete run: could not reach the server.');
  }
}

function pointFromCurve(p: { date: string; value: number }): { t: number; v: number } {
  return { t: parseDateMs(p.date), v: p.value };
}

const chartSeries = computed<EquitySeries[]>(() => {
  if (!result.value) return [];
  const series: EquitySeries[] = [
    { label: 'Rebalanced', points: result.value.equity_curve.map(pointFromCurve) },
    { label: 'Equal-weight buy & hold', points: result.value.buy_and_hold_equal_weight.equity_curve.map(pointFromCurve) },
  ];
  const bench = result.value.benchmark;
  if (bench && bench.equity_curve.length) {
    series.push({
      label: `Benchmark (${displayTicker(bench.symbol, result.value.config.exchange)})`,
      points: bench.equity_curve.map(pointFromCurve),
    });
  }
  return series;
});

const tickDatesMs = computed(() => (result.value?.rebalances ?? []).map((r) => parseDateMs(r.date)));

const unaffordableEntries = computed(() =>
  Object.entries(result.value?.unaffordable ?? {}).sort(([a], [b]) => a.localeCompare(b)),
);

onMounted(async () => {
  await loadOptions();
  await applyBasketQueryParam();
  loadRuns();
});
</script>
