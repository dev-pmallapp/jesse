<!--
  Stock search - the entry point into a single symbol's detail page. Before a query is
  typed this shows a short intro plus "recently viewed" (localStorage, see
  components/stocks/recentStocks.ts); once typing starts it debounces a
  POST /equities/search per keystroke and renders a ranked results table.
-->
<template>
  <AppCard title="Stocks">
    <div class="ng:flex ng:gap-2 ng:flex-wrap ng:items-end ng:mb-3">
      <FormField label="Search" class="ng:flex-1 ng:min-w-[220px]">
        <input
          v-model="query"
          type="text"
          placeholder="Ticker or company name, e.g. RELIANCE"
          class="ng:w-full ng:bg-bg ng:border ng:border-border ng:rounded-md ng:px-2.5 ng:py-1.5 ng:text-[13px] ng:text-text"
        />
      </FormField>
      <div class="ng:flex ng:gap-1 ng:mb-2.5">
        <button
          v-for="opt in EXCHANGE_OPTIONS"
          :key="opt.value ?? 'all'"
          type="button"
          class="ng:border ng:border-border ng:rounded-md ng:px-2.5 ng:py-1.5 ng:text-[12.5px] ng:cursor-pointer"
          :class="exchange === opt.value ? 'ng:bg-primary ng:text-bg ng:border-primary ng:font-semibold' : 'ng:bg-elevated ng:text-muted'"
          @click="exchange = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <Banner v-if="!catalogAvailable && hasSearched" message="Offline: showing imported stocks only." tone="warn" />
    <Banner :message="error" tone="error" />

    <!-- Pre-search state: intro + recently viewed -->
    <div v-if="!query.trim()">
      <p class="ng:text-muted ng:text-sm ng:mb-3">
        Search NSE/BSE equities by ticker or company name. Rows show whether the symbol
        already has imported candle data.
      </p>
      <template v-if="recents.length">
        <h3 class="ng:text-[12.5px] ng:font-medium ng:text-muted ng:mb-2 ng:mt-0">Recently viewed</h3>
        <div class="ng:flex ng:gap-1.5 ng:flex-wrap">
          <button
            v-for="r in recents"
            :key="r.ticker"
            type="button"
            class="ng:border ng:border-border ng:rounded-full ng:px-2.5 ng:py-1 ng:text-[12.5px] ng:bg-elevated ng:cursor-pointer ng:tabular-nums"
            @click="goToStock(r.ticker)"
          >
            {{ r.ticker }}
          </button>
        </div>
      </template>
    </div>

    <!-- Search state -->
    <template v-else>
      <p v-if="loading" class="ng:text-muted ng:text-sm ng:m-0">Searching...</p>
      <DataTable
        v-else
        :columns="columns"
        :rows="results"
        :row-key="(row) => row.ticker"
        empty-text="No matches."
      >
        <template #cell-ticker="{ row }">
          <span class="ng:cursor-pointer ng:font-medium ng:text-highlighted" @click="goToStock(row.ticker)">
            {{ row.ticker }}
          </span>
        </template>
        <template #cell-company="{ row }">
          <span class="ng:cursor-pointer" @click="goToStock(row.ticker)">{{ row.company ?? '-' }}</span>
        </template>
        <template #cell-industry="{ row }">
          <span class="ng:cursor-pointer ng:text-muted" @click="goToStock(row.ticker)">{{ row.industry ?? '-' }}</span>
        </template>
        <template #cell-exchange="{ row }">
          <span class="ng:cursor-pointer" @click="goToStock(row.ticker)">{{ row.exchange }}</span>
        </template>
        <template #cell-imported="{ row }">
          <span class="ng:cursor-pointer" @click="goToStock(row.ticker)">
            <StatusPill v-if="row.imported" tone="done">{{ row.imported.start_date }} - {{ row.imported.end_date }}</StatusPill>
            <span v-else class="ng:text-muted">not imported</span>
          </span>
        </template>
      </DataTable>
    </template>
  </AppCard>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import DataTable, { type DataTableColumn } from '../components/DataTable.vue';
import FormField from '../components/FormField.vue';
import StatusPill from '../components/StatusPill.vue';
import { loadRecentStocks, type RecentStock } from '../components/stocks/recentStocks';
import { searchEquities, type EquitySearchResult, type Exchange } from '../api/equities';
import { useNgNavigate, useNgNavigateReplace, useNgRoute } from '../router';

const navigate = useNgNavigate();
const navigateReplace = useNgNavigateReplace();
const route = useNgRoute();

const EXCHANGE_OPTIONS: { label: string; value: Exchange | null }[] = [
  { label: 'All', value: null },
  { label: 'NSE', value: 'NSE' },
  { label: 'BSE', value: 'BSE' },
];

const columns: DataTableColumn[] = [
  { key: 'ticker', label: 'Ticker', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'industry', label: 'Industry', sortable: true },
  { key: 'exchange', label: 'Exchange', sortable: true },
  { key: 'imported', label: 'Data' },
];

const query = ref(route.value.query.q ?? '');
const exchange = ref<Exchange | null>(null);
const results = ref<EquitySearchResult[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const catalogAvailable = ref(true);
const error = ref<string | null>(null);
const recents = ref<RecentStock[]>([]);

function goToStock(ticker: string): void {
  navigate(`/india/stock/${encodeURIComponent(ticker)}`);
}

let debounceHandle: ReturnType<typeof setTimeout> | null = null;

async function runSearch(): Promise<void> {
  const q = query.value.trim();
  if (!q) {
    results.value = [];
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await searchEquities(q, exchange.value, 30);
    if (!res.ok) {
      error.value = 'Could not search stocks.';
      results.value = [];
      return;
    }
    results.value = res.data.results;
    catalogAvailable.value = res.data.catalog_available;
    hasSearched.value = true;
  } catch {
    // api() already redirected to the login gate on a 401 - anything else here is a
    // network-level failure (offline, DNS, CORS, ...).
    error.value = 'Could not reach the server.';
  } finally {
    loading.value = false;
  }
}

// 250ms debounce on both the query text and the exchange toggle - also mirrors the
// settled query into the URL (?q=) so back navigation restores the last search instead
// of landing on the empty intro state. Uses replace (not push) so every keystroke's
// settled query doesn't each add its own back-button stop.
watch([query, exchange], () => {
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => {
    const q = query.value.trim();
    navigateReplace(q ? `/india/stocks?q=${encodeURIComponent(q)}` : '/india/stocks');
    runSearch();
  }, 250);
});

onMounted(() => {
  try {
    recents.value = loadRecentStocks();
  } catch {
    recents.value = [];
  }
  if (query.value.trim()) runSearch();
});

// Without this, a debounce timer scheduled just before the user clicks a result (or
// otherwise navigates away) would still fire after this component is torn down - its
// `navigateReplace`/`runSearch` calls would race the new page's own navigation/state.
onBeforeUnmount(() => {
  if (debounceHandle) clearTimeout(debounceHandle);
});
</script>
