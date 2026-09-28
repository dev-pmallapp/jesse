<!--
  One stock's reference data, imported-history stats and price chart. `symbol` (the
  route param) is a display ticker like "NSE:RELIANCE" - normalize_symbol() on the
  backend already accepts that TradingView-style form directly (see
  jesse/services/symbol_input.py), so the exchange/bare-symbol split below only exists
  to drive the two separate request fields the controller expects.
-->
<template>
  <div>
    <button
      type="button"
      class="ng:border-0 ng:bg-transparent ng:cursor-pointer ng:text-primary ng:text-[12.5px] ng:p-0 ng:mb-2.5"
      @click="navigate('/india/stocks')"
    >
      &larr; Back to search
    </button>

    <AppCard v-if="loading">
      <p class="ng:text-muted ng:text-sm ng:m-0">Loading {{ symbol }}...</p>
    </AppCard>

    <AppCard v-else-if="error">
      <Banner :message="error" tone="error" />
      <AppButton size="small" @click="load">Retry</AppButton>
    </AppCard>

    <template v-else-if="stock">
      <!-- header -->
      <AppCard>
        <div class="ng:flex ng:items-start ng:justify-between ng:flex-wrap ng:gap-3">
          <div>
            <div class="ng:flex ng:items-center ng:gap-2 ng:flex-wrap">
              <h2 class="ng:text-lg ng:font-semibold ng:text-highlighted ng:m-0">{{ stock.company ?? stock.ticker }}</h2>
              <StatusPill tone="default">{{ stock.exchange }}</StatusPill>
              <span v-if="stock.industry" class="ng:text-[12px] ng:text-muted ng:border ng:border-border ng:rounded-full ng:px-2 ng:py-0.5">
                {{ stock.industry }}
              </span>
            </div>
            <p class="ng:text-muted ng:text-[12.5px] ng:m-0 ng:mt-1 ng:tabular-nums">
              {{ stock.ticker }}<span v-if="stock.isin"> &middot; ISIN {{ stock.isin }}</span>
            </p>
          </div>
          <div v-if="stock.stats" class="ng:text-right">
            <div class="ng:text-2xl ng:font-semibold ng:text-highlighted ng:tabular-nums">{{ fmtINR(stock.stats.last_close) }}</div>
            <div class="ng:text-[12px] ng:text-muted">as of {{ stock.stats.last_date }}</div>
          </div>
        </div>

        <div v-if="stock.baskets.length" class="ng:flex ng:gap-1.5 ng:flex-wrap ng:mt-3">
          <button
            v-for="name in stock.baskets"
            :key="name"
            type="button"
            class="ng:border ng:border-border ng:rounded-full ng:px-2.5 ng:py-1 ng:text-[12px] ng:bg-elevated"
            :class="basketIdByName[name] ? 'ng:cursor-pointer' : 'ng:cursor-default ng:opacity-70'"
            @click="basketIdByName[name] && navigate(`/india/basket/${basketIdByName[name]}`)"
          >
            {{ name }}
          </button>
        </div>
      </AppCard>

      <!-- not imported: empty state -->
      <AppCard v-if="!stock.imported" title="Price data">
        <p class="ng:text-muted ng:text-sm ng:mb-3">
          {{ stock.ticker }} hasn't been imported yet, so no stats or chart are available.
        </p>
        <AppButton variant="primary" size="small" @click="navigate('/candles')">Import it from Candles &rarr; Import</AppButton>
      </AppCard>

      <template v-else-if="stock.stats">
        <!-- stats grid -->
        <AppCard title="Stats">
          <div class="ng:grid ng:gap-3" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr))">
            <div v-for="r in returnStats" :key="r.label">
              <div class="ng:text-[11px] ng:text-muted">{{ r.label }}</div>
              <div class="ng:text-sm ng:font-medium ng:tabular-nums" :class="retClass(r.value)">{{ fmtSignedPct(r.value) }}</div>
            </div>
            <div>
              <div class="ng:text-[11px] ng:text-muted">CAGR</div>
              <div class="ng:text-sm ng:font-medium ng:tabular-nums" :class="retClass(stock.stats.cagr_pct)">
                {{ fmtSignedPct(stock.stats.cagr_pct) }}
              </div>
            </div>
            <div>
              <div class="ng:text-[11px] ng:text-muted">Volatility (ann.)</div>
              <div class="ng:text-sm ng:font-medium ng:tabular-nums">{{ fmtPct(stock.stats.volatility_pct) }}</div>
            </div>
            <div>
              <div class="ng:text-[11px] ng:text-muted">Avg 20D volume</div>
              <div class="ng:text-sm ng:font-medium ng:tabular-nums">{{ fmtVolume(stock.stats.avg_volume_20d) }}</div>
            </div>
            <div>
              <div class="ng:text-[11px] ng:text-muted">Max drawdown</div>
              <div class="ng:text-sm ng:font-medium ng:tabular-nums ng:text-error">{{ fmtPct(stock.stats.max_drawdown.pct) }}</div>
              <div class="ng:text-[10.5px] ng:text-muted">
                {{ stock.stats.max_drawdown.peak_date }} &rarr; {{ stock.stats.max_drawdown.trough_date }}
              </div>
            </div>
          </div>

          <div class="ng:mt-4 ng:max-w-sm">
            <div class="ng:flex ng:justify-between ng:text-[11px] ng:text-muted ng:mb-1">
              <span>52W Low {{ fmtINR(stock.stats.week_52_low) }}</span>
              <span>52W High {{ fmtINR(stock.stats.week_52_high) }}</span>
            </div>
            <div class="ng:relative ng:h-1.5 ng:bg-accented ng:rounded-full">
              <div
                class="ng:absolute ng:top-1/2 ng:-translate-y-1/2 ng:-translate-x-1/2 ng:w-2.5 ng:h-2.5 ng:rounded-full ng:bg-primary ng:border ng:border-bg"
                :style="{ left: week52MarkerPct + '%' }"
                :title="`Last close ${fmtINR(stock.stats.last_close)}`"
              />
            </div>
          </div>
        </AppCard>

        <!-- price chart -->
        <AppCard title="Price">
          <Banner v-if="candlesError" :message="candlesError" tone="error" />
          <PriceChart
            :candles="candles"
            :timeframe="timeframe"
            :loading="candlesLoading"
            @timeframe-change="onTimeframeChange"
          />
        </AppCard>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import StatusPill from '../components/StatusPill.vue';
import PriceChart from '../components/stocks/PriceChart.vue';
import { recordRecentStock } from '../components/stocks/recentStocks';
import {
  getEquityCandles,
  getEquityStock,
  type CandleTimeframe,
  type EquityCandleRow,
  type EquityStockResponse,
  type Exchange,
} from '../api/equities';
import { listBaskets } from '../api/baskets';
import { fmtINR, fmtPct } from '../utils/format';
import { useNgNavigate } from '../router';

// Bound from the matched route's params (see router.ts's `stock-detail` pattern
// `/india/stock/:symbol`, e.g. "NSE:RELIANCE").
const props = defineProps<{ symbol?: string }>();

const navigate = useNgNavigate();

const stock = ref<EquityStockResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const basketIdByName = ref<Record<string, string>>({});

const candles = ref<EquityCandleRow[]>([]);
const timeframe = ref<CandleTimeframe>('1D');
const candlesLoading = ref(false);
const candlesError = ref<string | null>(null);

// "NSE:RELIANCE" -> {exchange: 'NSE', symbol: 'RELIANCE'}; normalize_symbol() on the
// backend would also accept the combined ticker as `symbol` with any exchange, but
// splitting keeps the request shape identical to every other equities call site.
function parseTicker(ticker: string | undefined): { exchange: Exchange; symbol: string } {
  const [exch, ...rest] = (ticker ?? '').split(':');
  const sym = rest.join(':');
  return { exchange: exch === 'BSE' ? 'BSE' : 'NSE', symbol: sym || exch };
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  stock.value = null;
  const { exchange, symbol } = parseTicker(props.symbol);
  try {
    const res = await getEquityStock(symbol, exchange);
    if (!res.ok) {
      error.value = 'Could not load this stock.';
      return;
    }
    stock.value = res.data;
    recordRecentStock({
      ticker: res.data.ticker,
      symbol: res.data.symbol,
      exchange: res.data.exchange,
      company: res.data.company,
    });
    if (res.data.imported) loadCandles();
  } catch {
    error.value = 'Could not reach the server.';
  } finally {
    loading.value = false;
  }
}

async function loadBasketIndex(): Promise<void> {
  try {
    const res = await listBaskets();
    basketIdByName.value = Object.fromEntries(res.baskets.map((b) => [b.name, b.id]));
  } catch {
    // Best effort - basket chips just render non-clickable if this fails, the stock
    // detail itself doesn't depend on it.
  }
}

async function loadCandles(): Promise<void> {
  const { exchange, symbol } = parseTicker(props.symbol);
  candlesLoading.value = true;
  candlesError.value = null;
  try {
    const res = await getEquityCandles(symbol, exchange, timeframe.value);
    if (!res.ok) {
      candlesError.value = 'Could not load candles.';
      return;
    }
    candles.value = res.data.candles;
  } catch {
    candlesError.value = 'Could not reach the server.';
  } finally {
    candlesLoading.value = false;
  }
}

function onTimeframeChange(tf: CandleTimeframe): void {
  timeframe.value = tf;
  loadCandles();
}

const returnStats = computed(() => {
  const r = stock.value?.stats?.returns;
  if (!r) return [];
  return [
    { label: '1M', value: r['1m'] },
    { label: '3M', value: r['3m'] },
    { label: '6M', value: r['6m'] },
    { label: '1Y', value: r['1y'] },
    { label: '3Y', value: r['3y'] },
    { label: '5Y', value: r['5y'] },
  ];
});

function fmtSignedPct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%';
}
function retClass(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'ng:text-muted';
  if (v > 0) return 'ng:text-success';
  if (v < 0) return 'ng:text-error';
  return 'ng:text-muted';
}
// Plain integer grouping (share count) - fmtINR would incorrectly prepend '₹'.
const VOLUME_FORMATTER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
function fmtVolume(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return VOLUME_FORMATTER.format(n);
}

const week52MarkerPct = computed(() => {
  const s = stock.value?.stats;
  if (!s) return 0;
  const span = s.week_52_high - s.week_52_low;
  if (span <= 0) return 50;
  return Math.max(0, Math.min(100, ((s.last_close - s.week_52_low) / span) * 100));
});

onMounted(() => {
  load();
  loadBasketIndex();
});

// A symbol->symbol in-app navigation (e.g. clicking another row from search) reuses
// this same mounted component instance - reload when the route param changes.
watch(
  () => props.symbol,
  () => {
    timeframe.value = '1D';
    candles.value = [];
    load();
  },
);
</script>
