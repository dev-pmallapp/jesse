<!--
  Inline SVG multi-series equity chart with a hover crosshair/tooltip - a Vue port of
  buildEquityChart()/wireChartInteractivity() from
  jesse/dashboard_patches/portfolio_page.template.js (see that file's own header for why
  an inline SVG rather than the bundle's own charting library: its export names are
  re-mangled on every upstream rebuild, same reason the whole dashboard_patches
  mechanism exists - this component has no such dependency).
-->
<template>
  <div ref="wrapperRef" class="ng:relative ng:mb-1.5">
    <div class="ng:flex ng:gap-4 ng:flex-wrap ng:mb-1.5 ng:text-xs ng:text-muted">
      <span v-for="(s, i) in series" :key="s.label" class="ng:inline-flex ng:items-center ng:gap-1">
        <span class="ng:w-2.5 ng:h-2.5 ng:rounded-full ng:inline-block" :style="{ background: colorFor(i) }" />
        {{ s.label }}
      </span>
    </div>
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${containerWidth} ${height}`"
      width="100%"
      :height="height"
      preserveAspectRatio="xMidYMid meet"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <line :x1="padL" :y1="padT" :x2="padL" :y2="padT + plotH" :stroke="axisColor" />
      <line :x1="padL" :y1="padT + plotH" :x2="padL + plotW" :y2="padT + plotH" :stroke="axisColor" />
      <text x="2" :y="padT + 4" font-size="10" :fill="textColor">{{ formatValue(vMaxRaw) }}</text>
      <text x="2" :y="padT + plotH" font-size="10" :fill="textColor">{{ formatValue(vMinRaw) }}</text>
      <text :x="padL" :y="height - 6" font-size="10" :fill="textColor">{{ axisDate(tMin) }}</text>
      <text :x="padL + plotW / 2" :y="height - 6" font-size="10" text-anchor="middle" :fill="textColor">
        {{ axisDate((tMin + tMax) / 2) }}
      </text>
      <text :x="padL + plotW" :y="height - 6" font-size="10" text-anchor="end" :fill="textColor">{{ axisDate(tMax) }}</text>
      <line
        v-for="(t, i) in tickDatesMs"
        :key="i"
        :x1="xPix(t)"
        :y1="padT + plotH"
        :x2="xPix(t)"
        :y2="padT + plotH + 5"
        :stroke="textColor"
      />
      <polyline
        v-for="(s, i) in series"
        :key="s.label"
        :points="polylinePoints(s)"
        fill="none"
        :stroke="colorFor(i)"
        stroke-width="2"
      />
      <line
        v-if="hover"
        :x1="hover.x"
        :y1="padT"
        :x2="hover.x"
        :y2="padT + plotH"
        :stroke="textColor"
        stroke-dasharray="3,3"
      />
      <rect :x="padL" :y="padT" :width="plotW" :height="plotH" fill="transparent" />
    </svg>
    <div
      v-if="hover"
      class="ng:absolute ng:top-1 ng:-translate-x-1/2 ng:bg-elevated ng:border ng:border-border ng:rounded-md ng:px-2 ng:py-1 ng:text-[11px] ng:text-text ng:pointer-events-none ng:whitespace-nowrap ng:shadow-sm"
      :style="{ left: hover.tooltipLeft + 'px' }"
    >
      {{ hover.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fmtINR } from '../utils/format';

export interface EquityPoint {
  t: number;
  v: number;
}
export interface EquitySeries {
  label: string;
  color?: string;
  points: EquityPoint[];
}

const props = withDefaults(
  defineProps<{
    series: EquitySeries[];
    tickDatesMs?: number[];
    width?: number;
    height?: number;
    valueFormatter?: (v: number) => string;
  }>(),
  { tickDatesMs: () => [], width: 760, height: 260, valueFormatter: undefined },
);

const formatValue = computed(() => props.valueFormatter ?? fmtINR);

// The chart used to render at a fixed `props.width` (default 760) regardless of its
// card's actual width, leaving a large empty gutter (or, on a narrower card, clipping)
// whenever the container wasn't exactly that wide - a ResizeObserver on the wrapper
// keeps the SVG's own coordinate space (viewBox) matched to the real rendered pixel
// width instead. `containerWidth` starts at `props.width` as a same-frame fallback
// until the observer's first callback fires.
const wrapperRef = ref<HTMLDivElement | null>(null);
const containerWidth = ref(props.width);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!wrapperRef.value) return;
  resizeObserver = new ResizeObserver((entries) => {
    const w = Math.round(entries[0]?.contentRect.width ?? 0);
    if (w > 0) containerWidth.value = w;
  });
  resizeObserver.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

// Compact, fixed-width left gutter for the y-axis labels (`fmtINR`-formatted values
// rarely exceed a few characters) - keeps most of the responsive width for the plot
// itself rather than scaling the gutter with the container.
const padL = 48;
const padR = 16;
const padT = 16;
const padB = 28;
const plotW = computed(() => Math.max(containerWidth.value - padL - padR, 1));
const plotH = computed(() => Math.max(props.height - padT - padB, 1));

const allPoints = computed(() => props.series.flatMap((s) => s.points));
const tMin = computed(() => Math.min(...allPoints.value.map((p) => p.t)));
const tMax = computed(() => Math.max(...allPoints.value.map((p) => p.t)));
const vMinRaw = computed(() => Math.min(...allPoints.value.map((p) => p.v)));
const vMaxRaw = computed(() => Math.max(...allPoints.value.map((p) => p.v)));
// 5% headroom so a line touching the series' own min/max doesn't render flush against
// the axis; the `|| 1` fallback guards a perfectly flat/single-point series from
// collapsing the y scale into a divide-by-zero.
const vPad = computed(() => (vMaxRaw.value - vMinRaw.value) * 0.05 || Math.abs(vMaxRaw.value) * 0.05 || 1);
const vMin = computed(() => vMinRaw.value - vPad.value);
const vMax = computed(() => vMaxRaw.value + vPad.value);

function xPix(t: number): number {
  return padL + (tMax.value === tMin.value ? plotW.value / 2 : ((t - tMin.value) / (tMax.value - tMin.value)) * plotW.value);
}
function yPix(v: number): number {
  return padT + plotH.value - ((v - vMin.value) / (vMax.value - vMin.value)) * plotH.value;
}

// These are raw SVG attribute values (stroke/fill), not Tailwind classes, so they must
// name the *actual* generated CSS custom property - `prefix(ng)` in styles/ng.css
// renames every theme variable from `--color-*` to `--ng-color-*` at build time, and
// only Tailwind's own utility-class output (e.g. `ng:border-primary`) gets that rename
// applied automatically.
const colorFallback = ['var(--ng-color-primary)', 'var(--ng-color-muted)', '#f59e0b'];
function colorFor(i: number): string {
  return props.series[i]?.color || colorFallback[i % colorFallback.length];
}
function polylinePoints(s: EquitySeries): string {
  return s.points.map((p) => `${xPix(p.t).toFixed(1)},${yPix(p.v).toFixed(1)}`).join(' ');
}
function axisDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

const axisColor = 'var(--ng-color-border)';
const textColor = 'var(--ng-color-muted)';

const svgRef = ref<SVGSVGElement | null>(null);
const hover = ref<{ x: number; tooltipLeft: number; text: string } | null>(null);

function nearestPoint(points: EquityPoint[], targetT: number): EquityPoint {
  let best = points[0];
  let bestDiff = Infinity;
  for (const p of points) {
    const diff = Math.abs(p.t - targetT);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}

function onMouseMove(evt: MouseEvent): void {
  const svg = svgRef.value;
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  if (!rect.width) return;
  // The svg's rendered box (width:100%) and its viewBox now track the same measured
  // `containerWidth`, so this ratio is normally ~1 - kept anyway (rather than using
  // `evt.clientX - rect.left` directly) so a stale rect between a resize and the next
  // ResizeObserver callback can't misplace the crosshair.
  const scaleX = containerWidth.value / rect.width;
  const mouseX = (evt.clientX - rect.left) * scaleX;
  const primaryPoints = props.series[0]?.points ?? [];
  if (!primaryPoints.length) return;

  let nearestByX = primaryPoints[0];
  let bestDiff = Infinity;
  for (const p of primaryPoints) {
    const diff = Math.abs(xPix(p.t) - mouseX);
    if (diff < bestDiff) {
      bestDiff = diff;
      nearestByX = p;
    }
  }

  const parts = [new Date(nearestByX.t).toISOString().slice(0, 10)];
  for (const s of props.series) {
    const p = nearestPoint(s.points, nearestByX.t);
    parts.push(`${s.label}: ${formatValue.value(p.v)}`);
  }

  hover.value = {
    x: xPix(nearestByX.t),
    tooltipLeft: Math.min(Math.max(evt.clientX - rect.left, 0), rect.width - 4),
    text: parts.join('   '),
  };
}

function onMouseLeave(): void {
  hover.value = null;
}
</script>
