<!--
  Close-price line + volume bars for one stock's candles. Unlike EquityChart.vue (built
  for multi-series equity curves with no volume), this always renders exactly one price
  series plus a volume panel underneath sharing the same x scale, so it's a separate
  component rather than a reuse of EquityChart. Inline SVG for the same reason as
  EquityChart (see that file's header) - no charting library survives an upstream
  bundle rebuild's export-name mangling.
-->
<template>
  <div>
    <div class="ng:flex ng:items-center ng:justify-between ng:flex-wrap ng:gap-2 ng:mb-2.5">
      <div class="ng:flex ng:gap-1">
        <button
          v-for="opt in RANGE_OPTIONS"
          :key="opt"
          type="button"
          class="ng:border ng:border-border ng:rounded-md ng:px-2 ng:py-1 ng:text-[12px] ng:cursor-pointer"
          :class="selectedRange === opt ? 'ng:bg-primary ng:text-bg ng:border-primary ng:font-semibold' : 'ng:bg-elevated ng:text-muted'"
          @click="selectedRange = opt"
        >
          {{ opt }}
        </button>
      </div>
      <div class="ng:flex ng:gap-1">
        <button
          v-for="tf in (['1D', '1W'] as const)"
          :key="tf"
          type="button"
          class="ng:border ng:border-border ng:rounded-md ng:px-2 ng:py-1 ng:text-[12px] ng:cursor-pointer"
          :class="timeframe === tf ? 'ng:bg-primary ng:text-bg ng:border-primary ng:font-semibold' : 'ng:bg-elevated ng:text-muted'"
          @click="$emit('timeframe-change', tf)"
        >
          {{ tf }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="ng:text-muted ng:text-sm ng:m-0">Loading candles...</p>
    <p v-else-if="!filteredCandles.length" class="ng:text-muted ng:text-sm ng:m-0">No candle data for this range.</p>
    <div v-else class="ng:relative">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${width} ${height}`"
        width="100%"
        :height="height"
        preserveAspectRatio="xMidYMid meet"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      >
        <!-- price panel axis + labels -->
        <line :x1="padL" :y1="padT" :x2="padL" :y2="priceBaselineY" :stroke="axisColor" />
        <line :x1="padL" :y1="priceBaselineY" :x2="padL + plotW" :y2="priceBaselineY" :stroke="axisColor" />
        <text x="2" :y="padT + 4" font-size="10" :fill="textColor">{{ fmtINR(priceMax) }}</text>
        <text x="2" :y="priceBaselineY" font-size="10" :fill="textColor">{{ fmtINR(priceMin) }}</text>

        <!-- area fill + close line -->
        <path :d="areaPath" :fill="primaryColor" fill-opacity="0.12" stroke="none" />
        <polyline :points="linePoints" fill="none" :stroke="primaryColor" stroke-width="1.6" />

        <!-- volume panel -->
        <line :x1="padL" :y1="volBaselineY" :x2="padL + plotW" :y2="volBaselineY" :stroke="axisColor" />
        <text x="2" :y="volTopY + 8" font-size="10" :fill="textColor">{{ fmtVolume(volMax) }}</text>
        <rect
          v-for="(c, i) in filteredCandles"
          :key="c[0]"
          :x="xPix(i) - barWidth / 2"
          :y="volY(c[5])"
          :width="barWidth"
          :height="Math.max(volBaselineY - volY(c[5]), 0)"
          :fill="c[4] >= c[1] ? successColor : errorColor"
          fill-opacity="0.55"
        />

        <!-- x-axis date ticks (first / mid / last) -->
        <text x="2" :y="height - 4" font-size="10" :fill="textColor">{{ axisDate(filteredCandles[0][0]) }}</text>
        <text :x="padL + plotW / 2" :y="height - 4" font-size="10" text-anchor="middle" :fill="textColor">
          {{ axisDate(filteredCandles[Math.floor((filteredCandles.length - 1) / 2)][0]) }}
        </text>
        <text :x="padL + plotW" :y="height - 4" font-size="10" text-anchor="end" :fill="textColor">
          {{ axisDate(filteredCandles[filteredCandles.length - 1][0]) }}
        </text>

        <line v-if="hover" :x1="hover.x" :y1="padT" :x2="hover.x" :y2="volBaselineY" :stroke="textColor" stroke-dasharray="3,3" />
        <circle v-if="hover" :cx="hover.x" :cy="hover.priceY" r="2.5" :fill="primaryColor" />
        <rect :x="padL" :y="padT" :width="plotW" :height="volBaselineY - padT" fill="transparent" />
      </svg>
      <div
        v-if="hover"
        class="ng:absolute ng:top-1 ng:-translate-x-1/2 ng:bg-elevated ng:border ng:border-border ng:rounded-md ng:px-2 ng:py-1 ng:text-[11px] ng:text-text ng:pointer-events-none ng:whitespace-nowrap ng:shadow-sm"
        :style="{ left: hover.tooltipLeft + 'px' }"
      >
        {{ hover.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CandleTimeframe, EquityCandleRow } from '../../api/equities';
import { fmtINR } from '../../utils/format';

const props = withDefaults(
  defineProps<{
    candles: EquityCandleRow[];
    timeframe: CandleTimeframe;
    loading?: boolean;
    width?: number;
  }>(),
  { loading: false, width: 760 },
);

defineEmits<{ 'timeframe-change': [tf: CandleTimeframe] }>();

type RangeOption = '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'Max';
const RANGE_OPTIONS: RangeOption[] = ['1M', '6M', '1Y', '3Y', '5Y', 'Max'];
// Approximate (calendar, not trading-day) day counts - good enough for a client-side
// chart range filter; the backend's own lookback-return math (equities_controller.py's
// _shift_months) is the precise version used for the stats grid.
const RANGE_DAYS: Record<Exclude<RangeOption, 'Max'>, number> = {
  '1M': 30,
  '6M': 182,
  '1Y': 365,
  '3Y': 365 * 3,
  '5Y': 365 * 5,
};
const DAY_MS = 86_400_000;

const selectedRange = ref<RangeOption>('1Y');

const filteredCandles = computed(() => {
  const all = props.candles;
  if (!all.length || selectedRange.value === 'Max') return all;
  const cutoff = all[all.length - 1][0] - RANGE_DAYS[selectedRange.value] * DAY_MS;
  const sliced = all.filter((c) => c[0] >= cutoff);
  // A range wider than the imported history would otherwise filter to nothing - fall
  // back to the full series rather than rendering an empty chart.
  return sliced.length ? sliced : all;
});

// --- layout: a price panel stacked above a volume panel, sharing one x scale ---
const padL = 56;
const padR = 12;
const padT = 8;
const priceH = 180;
const gapH = 8;
const volH = 64;
const padB = 22;
const height = padT + priceH + gapH + volH + padB;
const priceBaselineY = padT + priceH;
const volTopY = priceBaselineY + gapH;
const volBaselineY = volTopY + volH;

const plotW = computed(() => Math.max(props.width - padL - padR, 1));
const barWidth = computed(() => Math.max((plotW.value / Math.max(filteredCandles.value.length, 1)) * 0.7, 1));

const closes = computed(() => filteredCandles.value.map((c) => c[4]));
const priceMinRaw = computed(() => Math.min(...closes.value));
const priceMaxRaw = computed(() => Math.max(...closes.value));
// 5% headroom, same rationale as EquityChart.vue's vPad - keeps the line off the axis
// edges and guards a flat/single-point series from a divide-by-zero y scale.
const pricePad = computed(() => (priceMaxRaw.value - priceMinRaw.value) * 0.05 || Math.abs(priceMaxRaw.value) * 0.05 || 1);
const priceMin = computed(() => priceMinRaw.value - pricePad.value);
const priceMax = computed(() => priceMaxRaw.value + pricePad.value);
const volMax = computed(() => Math.max(...filteredCandles.value.map((c) => c[5]), 1));

function xPix(i: number): number {
  const n = filteredCandles.value.length;
  return padL + (n <= 1 ? plotW.value / 2 : (i / (n - 1)) * plotW.value);
}
function priceY(v: number): number {
  return padT + priceH - ((v - priceMin.value) / (priceMax.value - priceMin.value)) * priceH;
}
function volY(v: number): number {
  return volBaselineY - (v / volMax.value) * volH;
}

const linePoints = computed(() =>
  filteredCandles.value.map((c, i) => `${xPix(i).toFixed(1)},${priceY(c[4]).toFixed(1)}`).join(' '),
);
const areaPath = computed(() => {
  const pts = filteredCandles.value;
  if (!pts.length) return '';
  const first = `M ${xPix(0).toFixed(1)},${priceBaselineY}`;
  const line = pts.map((c, i) => `L ${xPix(i).toFixed(1)},${priceY(c[4]).toFixed(1)}`).join(' ');
  const close = `L ${xPix(pts.length - 1).toFixed(1)},${priceBaselineY} Z`;
  return `${first} ${line} ${close}`;
});

// Raw SVG attribute values (not Tailwind classes) must name the actual generated CSS
// custom property - `prefix(ng)` in styles/ng.css renames theme vars to `--ng-color-*`,
// and only Tailwind's own utility-class output picks that rename up automatically.
const axisColor = 'var(--ng-color-border)';
const textColor = 'var(--ng-color-muted)';
const primaryColor = 'var(--ng-color-primary)';
const successColor = 'var(--ng-color-success)';
const errorColor = 'var(--ng-color-error)';

// Plain integer grouping (lakh/crore style, no currency symbol) - fmtINR from
// utils/format.ts prepends '₹', which volume (a share count) shouldn't have.
const VOLUME_FORMATTER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
function fmtVolume(n: number): string {
  return VOLUME_FORMATTER.format(n);
}
function axisDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const svgRef = ref<SVGSVGElement | null>(null);
const hover = ref<{ x: number; priceY: number; tooltipLeft: number; text: string } | null>(null);

function onMouseMove(evt: MouseEvent): void {
  const svg = svgRef.value;
  const pts = filteredCandles.value;
  if (!svg || !pts.length) return;
  const rect = svg.getBoundingClientRect();
  if (!rect.width) return;
  const scaleX = props.width / rect.width;
  const mouseX = (evt.clientX - rect.left) * scaleX;

  let nearestI = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const diff = Math.abs(xPix(i) - mouseX);
    if (diff < bestDiff) {
      bestDiff = diff;
      nearestI = i;
    }
  }
  const c = pts[nearestI];
  hover.value = {
    x: xPix(nearestI),
    priceY: priceY(c[4]),
    tooltipLeft: Math.min(Math.max(evt.clientX - rect.left, 0), rect.width - 4),
    text: `${axisDate(c[0])}   Close: ${fmtINR(c[4])}   Vol: ${fmtVolume(c[5])}`,
  };
}
function onMouseLeave(): void {
  hover.value = null;
}
</script>
