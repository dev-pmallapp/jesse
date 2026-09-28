<!--
  "Holdings over time": one expandable row per rebalance (day 0's initial purchase is
  the first entry - see `simulate()`'s docstring), each expanding to its trades table.
  The API result only carries per-symbol quantities for the FINAL holdings (see
  `PortfolioBacktestResult.final_holdings` - there's no per-rebalance snapshot to show
  for earlier entries), so the holdings table only ever attaches to the last rebalance.
-->
<template>
  <div class="ng:space-y-2">
    <p v-if="!rebalances.length" class="ng:text-muted ng:text-sm">No rebalances.</p>
    <div v-for="(reb, i) in rebalances" :key="reb.date" class="ng:border ng:border-border ng:rounded-md">
      <button
        type="button"
        class="ng:w-full ng:flex ng:items-center ng:justify-between ng:gap-2 ng:flex-wrap ng:px-3 ng:py-2 ng:text-left ng:bg-transparent ng:border-0 ng:cursor-pointer"
        @click="toggle(i)"
      >
        <span class="ng:flex ng:items-center ng:gap-2 ng:text-[13px]">
          <span class="ng:text-muted ng:w-3 ng:inline-block">{{ expanded.has(i) ? '▼' : '▶' }}</span>
          <span class="ng:font-medium ng:text-highlighted">{{ reb.date }}</span>
          <span v-if="i === 0" class="ng:text-muted">(initial purchase)</span>
        </span>
        <span class="ng:flex ng:gap-3.5 ng:text-[12.5px] ng:text-muted">
          <span>Value before {{ fmtINR(reb.value_before) }}</span>
          <span>{{ reb.trades.length }} trade{{ reb.trades.length === 1 ? '' : 's' }}</span>
          <span>Cash after {{ fmtINR(reb.cash_after) }}</span>
        </span>
      </button>

      <div v-if="expanded.has(i)" class="ng:px-3 ng:pb-3">
        <DataTable :columns="tradeColumns" :rows="reb.trades" :row-key="tradeKey" empty-text="No trades.">
          <template #cell-symbol="{ row }">
            <button type="button" class="ng:bg-transparent ng:border-0 ng:p-0 ng:text-primary ng:underline ng:cursor-pointer" @click="navigate(stockPath(exchange, String(row.symbol)))">
              {{ displayTicker(String(row.symbol), exchange) }}
            </button>
          </template>
          <template #cell-price="{ value }">{{ fmtINR(value as number) }}</template>
          <template #cell-notional="{ value }">{{ fmtINR(value as number) }}</template>
        </DataTable>

        <div v-if="i === rebalances.length - 1 && holdingRows.length" class="ng:mt-3">
          <h3 class="ng:text-[11px] ng:uppercase ng:tracking-wide ng:text-muted ng:mb-1.5">Final holdings</h3>
          <DataTable :columns="holdingColumns" :rows="holdingRows" :row-key="(r) => String(r.symbol)" empty-text="No holdings.">
            <template #cell-symbol="{ row }">
              <button type="button" class="ng:bg-transparent ng:border-0 ng:p-0 ng:text-primary ng:underline ng:cursor-pointer" @click="navigate(stockPath(exchange, String(row.symbol)))">
                {{ displayTicker(String(row.symbol), exchange) }}
              </button>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DataTable, { type DataTableColumn } from '../DataTable.vue';
import { displayTicker, fmtINR } from '../../utils/format';
import { holdingRows as buildHoldingRows, stockPath, type Rebalance, type Trade } from '../../api/portfolio';
import { useNgNavigate } from '../../router';

const props = defineProps<{
  rebalances: Rebalance[];
  finalHoldings: Record<string, number>;
  exchange: string;
}>();

const navigate = useNgNavigate();

const expanded = ref(new Set<number>());
function toggle(i: number): void {
  if (expanded.value.has(i)) expanded.value.delete(i);
  else expanded.value.add(i);
  // Force a new Set instance - mutating in place wouldn't trigger a `ref` update.
  expanded.value = new Set(expanded.value);
}

function tradeKey(t: Trade): string {
  return `${t.symbol}-${t.side}`;
}

const tradeColumns: DataTableColumn[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'side', label: 'Side' },
  { key: 'qty', label: 'Qty' },
  { key: 'price', label: 'Price' },
  { key: 'notional', label: 'Notional' },
];

const holdingColumns: DataTableColumn[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'qty', label: 'Qty' },
];

const holdingRows = computed(() => buildHoldingRows(props.finalHoldings));
</script>
