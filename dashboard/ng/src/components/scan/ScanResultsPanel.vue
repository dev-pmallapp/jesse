<!--
  Results for the currently open session: survivorship warning, skipped symbols,
  per-strategy summary, and the ranked per-stock table (the redesign's main content -
  "run a strategy on every stock and rank the results"). Ports
  universe_scan_page.template.js's renderSurvivorship/renderSkipped/renderSummary/
  renderRows/onDownloadCsvClick, replacing that template's dynamic raw-field dump table
  with fixed, named columns since every row now has a known, uniform shape
  (see helpers.py's build_row) once flattened by `toRankedRows`.
-->
<template>
  <AppCard title="Results">
    <template #actions>
      <span class="ng:text-muted ng:text-xs">{{ session.id }} ({{ session.status }})</span>
      <AppButton size="small" @click="onDownloadCsv">Download rows CSV</AppButton>
    </template>

    <Banner :message="survivorshipMessage" tone="warn" />

    <div v-if="session.skipped.length" class="ng:mb-3.5">
      <h3 class="ng:text-xs ng:uppercase ng:tracking-wide ng:text-muted ng:mb-1.5">Skipped symbols</h3>
      <DataTable
        :columns="[{ key: 'symbol', label: 'Symbol' }, { key: 'reason', label: 'Reason' }]"
        :rows="session.skipped as unknown as Record<string, unknown>[]"
      />
    </div>

    <div v-if="session.summary.length" class="ng:mb-3.5">
      <h3 class="ng:text-xs ng:uppercase ng:tracking-wide ng:text-muted ng:mb-1.5">Strategy summary (TEST window)</h3>
      <DataTable :columns="summaryColumns" :rows="summaryRows" :row-key="(r) => `${r.phase}-${r.strategy}`" />
    </div>

    <div class="ng:flex ng:flex-wrap ng:items-center ng:gap-2 ng:mb-2">
      <select v-model="phaseFilter" class="ng:border ng:border-border ng:rounded-md ng:bg-bg ng:text-text ng:px-2 ng:py-1 ng:text-[13px]">
        <option value="">All phases</option>
        <option v-for="p in phaseOptions" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="strategyFilter" class="ng:border ng:border-border ng:rounded-md ng:bg-bg ng:text-text ng:px-2 ng:py-1 ng:text-[13px]">
        <option value="">All strategies</option>
        <option v-for="s in strategyOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <input
        v-model="symbolFilter"
        type="text"
        placeholder="Filter by ticker..."
        class="ng:border ng:border-border ng:rounded-md ng:bg-bg ng:text-text ng:px-2 ng:py-1 ng:text-[13px] ng:w-52"
      />
      <label class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:ml-auto">
        <input v-model="onlyBeatBh" type="checkbox" />
        Only stocks beating buy &amp; hold
      </label>
    </div>

    <DataTable :columns="rankedColumns" :rows="filteredRankedRows" :row-key="(r) => `${r.phase}-${r.strategy}-${r.symbol}`" empty-text="No rows match the current filters.">
      <template #cell-ticker="{ row }">
        <button type="button" class="ng:bg-transparent ng:border-0 ng:p-0 ng:text-primary ng:underline ng:cursor-pointer" @click="navigate(`/india/stock/${encodeURIComponent(row.ticker as string)}`)">
          {{ row.ticker }}
        </button>
      </template>
      <template #cell-pnlPct="{ row }">
        <span :class="row.beatsBh ? 'ng:text-success ng:font-semibold' : ''">{{ fmtPct(row.pnlPct as number | null) }}</span>
      </template>
      <template #cell-bhPct="{ row }">{{ fmtPct(row.bhPct as number | null) }}</template>
      <template #cell-beatsBh="{ row }">
        <span v-if="row.error" class="ng:text-error">error</span>
        <span v-else :class="row.beatsBh ? 'ng:text-success' : 'ng:text-muted'">{{ row.beatsBh ? 'beats' : 'no' }}</span>
      </template>
      <template #cell-sharpe="{ row }">{{ fmtNum(row.sharpe as number | null) }}</template>
      <template #cell-maxDd="{ row }">{{ fmtPct(row.maxDd as number | null) }}</template>
      <template #cell-winRate="{ row }">{{ fmtPct(row.winRate as number | null) }}</template>
      <template #cell-error="{ row }">
        <span v-if="row.error" class="ng:text-error">{{ row.error }}</span>
        <span v-else>-</span>
      </template>
    </DataTable>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '../AppButton.vue';
import AppCard from '../AppCard.vue';
import Banner from '../Banner.vue';
import DataTable, { type DataTableColumn } from '../DataTable.vue';
import { csvEscape, downloadTextFile } from '../../utils/csv';
import { fmtNum, fmtPct } from '../../utils/format';
import { useNgNavigate } from '../../router';
import { toRankedRows, type ScanRankedRow, type ScanSession, type ScanSummaryRow } from '../../api/scan';

const props = defineProps<{ session: ScanSession }>();
const navigate = useNgNavigate();

// `_session_summary` (the /sessions list) omits this field entirely; only a full
// `/session` fetch carries it - see ScanSession's own comment.
const survivorshipMessage = computed<string | null>(() => {
  const w = props.session.survivorship_warning;
  if (!w) return null;
  return typeof w === 'string'
    ? w
    : "Survivorship bias warning: at least one basket was resolved using TODAY's index membership over a past window. " +
      "Absolute returns are inflated by construction - compare strategies against each stock's own buy & hold, not zero.";
});

const summaryColumns: DataTableColumn[] = [
  { key: 'phase', label: 'Phase', sortable: true },
  { key: 'strategy', label: 'Strategy', sortable: true },
  { key: 'stocks', label: 'Stocks', sortable: true },
  { key: 'trades', label: 'Trades', sortable: true },
  { key: 'win_rate_pct', label: 'Win %', sortable: true },
  { key: 'median_pnl_pct', label: 'Med Return %', sortable: true },
  { key: 'median_bh_pct', label: 'Med B&H %', sortable: true },
  { key: 'beat_bh', label: 'Beat B&H', sortable: true },
  { key: 'median_sharpe', label: 'Med Sharpe', sortable: true },
  { key: 'median_train_pnl_pct', label: 'Train Med Return %', sortable: true },
  { key: 'median_train_bh_pct', label: 'Train Med B&H %', sortable: true },
  { key: 'errors', label: 'Errors', sortable: true },
];
// Index signature added for DataTable's generic bound - ScanSummaryRow itself stays a
// plain API-contract type in api/scan.ts.
const summaryRows = computed(() => props.session.summary as unknown as (ScanSummaryRow & Record<string, unknown>)[]);

const rankedColumns: DataTableColumn[] = [
  { key: 'ticker', label: 'Ticker', sortable: true },
  { key: 'phase', label: 'Phase', sortable: true },
  { key: 'strategy', label: 'Strategy', sortable: true },
  { key: 'pnlPct', label: 'Return %', sortable: true },
  { key: 'bhPct', label: 'Buy & Hold %', sortable: true },
  { key: 'beatsBh', label: 'vs B&H', sortable: true },
  { key: 'sharpe', label: 'Sharpe', sortable: true },
  { key: 'maxDd', label: 'Max DD %', sortable: true },
  { key: 'trades', label: 'Trades', sortable: true },
  { key: 'winRate', label: 'Win %', sortable: true },
  // Column key matches ScanRankedRow's actual `error` field (not a separate "note"
  // field) so the CSV export below - which reads `row[c.key]` - picks it up correctly.
  { key: 'error', label: 'Notes', sortable: false },
];

const rankedRows = computed(() => toRankedRows(props.session));

const phaseFilter = ref('');
const strategyFilter = ref('');
const symbolFilter = ref('');
const onlyBeatBh = ref(false);

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}
const phaseOptions = computed(() => uniqueSorted(rankedRows.value.map((r) => r.phase)));
const strategyOptions = computed(() => uniqueSorted(rankedRows.value.map((r) => r.strategy)));

const filteredRankedRows = computed<ScanRankedRow[]>(() => {
  const symbolText = symbolFilter.value.trim().toUpperCase();
  return rankedRows.value.filter((r) => {
    if (phaseFilter.value && r.phase !== phaseFilter.value) return false;
    if (strategyFilter.value && r.strategy !== strategyFilter.value) return false;
    if (symbolText && !r.ticker.toUpperCase().includes(symbolText)) return false;
    if (onlyBeatBh.value && !r.beatsBh) return false;
    return true;
  });
});

function onDownloadCsv(): void {
  const columns = rankedColumns.map((c) => c.key);
  const lines = [columns.join(',')];
  for (const row of filteredRankedRows.value) {
    lines.push(columns.map((c) => csvEscape(row[c])).join(','));
  }
  downloadTextFile(`universe-scan-${props.session.id}-results.csv`, lines.join('\n'));
}
</script>
