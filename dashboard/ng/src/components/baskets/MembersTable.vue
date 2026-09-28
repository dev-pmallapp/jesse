<template>
  <div class="ng:overflow-x-auto ng:border ng:border-border ng:rounded-md">
    <table class="ng:border-collapse ng:w-full ng:min-w-[720px]">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:text-left ng:whitespace-nowrap ng:text-[12.5px] ng:text-muted ng:sticky ng:top-0 ng:bg-elevated ng:cursor-pointer ng:select-none"
            @click="toggleSort(col.key)"
          >
            {{ col.label }}<span v-if="sortKey === col.key">{{ sortDir === 1 ? '↑' : '↓' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row.ticker" class="ng:hover:bg-accented ng:cursor-pointer" @click="$emit('select', row.ticker)">
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:font-medium ng:text-highlighted">
            {{ row.ticker }}
          </td>
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:max-w-[220px] ng:overflow-hidden ng:text-ellipsis">
            {{ row.company }}
          </td>
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:text-muted">
            {{ row.industry ?? '-' }}
          </td>
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:text-right ng:tabular-nums">
            {{ fmtINR(row.last_close) }}
          </td>
          <td
            class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:text-right ng:tabular-nums"
            :class="returnClass(row.return_1y)"
          >
            {{ fmtPct(row.return_1y) }}
          </td>
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px] ng:text-right ng:tabular-nums">
            {{ fmtPct(weightPct(row)) }}
          </td>
          <td class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px]">
            <StatusPill v-if="row.imported" tone="done">Imported</StatusPill>
            <StatusPill v-else tone="error">Missing</StatusPill>
          </td>
        </tr>
        <tr v-if="!sortedRows.length">
          <td :colspan="columns.length" class="ng:px-2.5 ng:py-3 ng:text-muted ng:text-center ng:text-[12.5px]">
            No members match this filter.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import StatusPill from '../StatusPill.vue';
import { fmtINR, fmtPct } from '../../utils/format';
import type { BasketMember } from '../../api/baskets';

const props = defineProps<{ members: BasketMember[]; totalCount: number }>();
defineEmits<{ select: [string] }>();

const columns: { key: string; label: string }[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'company', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'last_close', label: 'Last close' },
  { key: 'return_1y', label: '1Y return' },
  { key: 'weight', label: 'Equal weight' },
  { key: 'imported', label: 'Data' },
];

const sortKey = ref<string | null>(null);
const sortDir = ref<1 | -1>(1);

function toggleSort(key: string): void {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1;
  else {
    sortKey.value = key;
    sortDir.value = 1;
  }
}

// All current baskets are equal-weight research baskets (1/N) - `member.weight` is a
// forward-compatible field for mutual-fund baskets, whose holdings carry a real
// portfolio weight once that API lands (see api/baskets.ts).
function weightPct(row: BasketMember): number {
  if (row.weight != null) return row.weight * 100;
  return props.totalCount ? (1 / props.totalCount) * 100 : 0;
}

function returnClass(v: number | null): string {
  if (v === null || v === undefined) return 'ng:text-muted';
  return v >= 0 ? 'ng:text-success' : 'ng:text-error';
}

// A bespoke sort (rather than DataTable.vue's generic one) because two columns need
// derived values DataTable's plain field lookup can't express: `weight` is computed
// (equal-weight fallback), and `imported` sorts by presence, not the object itself.
function valueFor(row: BasketMember, key: string): number | string | null {
  if (key === 'weight') return weightPct(row);
  if (key === 'imported') return row.imported ? 1 : 0;
  if (key === 'ticker') return row.ticker;
  if (key === 'company') return row.company;
  if (key === 'industry') return row.industry;
  if (key === 'last_close') return row.last_close;
  if (key === 'return_1y') return row.return_1y;
  return null;
}

// Same null/undefined-last convention as DataTable.vue's sortedRows, so missing
// last_close/return_1y/industry values don't jump around when the sort direction flips.
const sortedRows = computed(() => {
  if (!sortKey.value) return props.members;
  const key = sortKey.value;
  const dir = sortDir.value;
  return [...props.members].sort((a, b) => {
    const av = valueFor(a, key);
    const bv = valueFor(b, key);
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
});
</script>
