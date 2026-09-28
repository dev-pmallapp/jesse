<!--
  Six dense summary tiles for one backtest result: final value, total return, CAGR,
  Sharpe, max drawdown, and the rebalanced portfolio's excess return over the chosen
  benchmark (only computable when a benchmark was passed and its window overlaps the
  portfolio's own calendar - see BenchmarkCurve's docstring in api/portfolio.ts).
-->
<template>
  <div class="ng:grid ng:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] ng:gap-2.5 ng:mb-2">
    <div v-for="tile in tiles" :key="tile.label" class="ng:bg-elevated ng:border ng:border-border ng:rounded-lg ng:p-3">
      <div class="ng:text-[11px] ng:text-muted ng:uppercase ng:tracking-wide ng:mb-1">{{ tile.label }}</div>
      <div class="ng:text-[17px] ng:font-semibold" :class="tile.tone">{{ tile.value }}</div>
    </div>
  </div>
  <p class="ng:text-muted ng:text-xs ng:mb-3.5">
    {{ result.metrics.n_rebalances }} rebalance{{ result.metrics.n_rebalances === 1 ? '' : 's' }}
    &nbsp;|&nbsp; total fees {{ fmtINR(result.metrics.total_fees) }}
    &nbsp;|&nbsp; turnover {{ fmtNum(result.metrics.turnover) }}x
    &nbsp;|&nbsp; avg cash {{ fmtNum(result.metrics.avg_cash_pct) }}%
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { fmtINR, fmtNum, fmtPct } from '../../utils/format';
import type { PortfolioBacktestResult } from '../../api/portfolio';

const props = defineProps<{ result: PortfolioBacktestResult }>();

function toneFor(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return n >= 0 ? 'ng:text-success' : 'ng:text-error';
}

// `undefined` when no benchmark was requested or its curve never overlapped the
// portfolio's own session calendar (an empty `BenchmarkCurve.metrics`) - distinct from
// a computed 0% excess, so the tile can say "No benchmark" instead of a misleading 0.00%.
const excessPct = computed(() => {
  const bench = props.result.benchmark?.metrics?.total_return_pct;
  if (bench === undefined) return undefined;
  return props.result.metrics.total_return_pct - bench;
});

const tiles = computed(() => {
  const m = props.result.metrics;
  return [
    { label: 'Final value', value: fmtINR(m.final_value), tone: '' },
    { label: 'Total return', value: fmtPct(m.total_return_pct), tone: toneFor(m.total_return_pct) },
    { label: 'CAGR', value: fmtPct(m.cagr_pct), tone: toneFor(m.cagr_pct) },
    { label: 'Sharpe', value: fmtNum(m.sharpe), tone: toneFor(m.sharpe) },
    { label: 'Max drawdown', value: fmtPct(m.max_drawdown_pct), tone: 'ng:text-error' },
    {
      label: 'vs Benchmark',
      value: excessPct.value === undefined ? 'No benchmark' : fmtPct(excessPct.value),
      tone: excessPct.value === undefined ? '' : toneFor(excessPct.value),
    },
  ];
});
</script>
