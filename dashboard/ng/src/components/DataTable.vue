<template>
  <div class="ng:overflow-x-auto ng:border ng:border-border ng:rounded-md">
    <table class="ng:border-collapse ng:w-full ng:min-w-[420px]">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:text-left ng:whitespace-nowrap ng:text-[12.5px] ng:text-muted ng:sticky ng:top-0 ng:bg-elevated"
            :class="col.sortable ? 'ng:cursor-pointer ng:select-none' : ''"
            @click="col.sortable && toggleSort(col.key)"
          >
            {{ col.label }}<span v-if="sortKey === col.key">{{ sortDir === 1 ? '↑' : '↓' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in sortedRows" :key="rowKey ? rowKey(row) : i" class="ng:hover:bg-accented">
          <td
            v-for="col in columns"
            :key="col.key"
            class="ng:px-2.5 ng:py-1.5 ng:border-b ng:border-border ng:whitespace-nowrap ng:text-[12.5px]"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ formatCell(row[col.key]) }}</slot>
          </td>
        </tr>
        <tr v-if="!sortedRows.length">
          <td :colspan="columns.length" class="ng:px-2.5 ng:py-3 ng:text-muted ng:text-center ng:text-[12.5px]">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[];
    rows: T[];
    rowKey?: (row: T) => string | number;
    emptyText?: string;
  }>(),
  { emptyText: 'No rows.' },
);

const sortKey = ref<string | null>(null);
const sortDir = ref<1 | -1>(1);

function toggleSort(key: string): void {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1;
  else {
    sortKey.value = key;
    sortDir.value = 1;
  }
}

// Same ordering rules as the reference DOM implementations this ports
// (universe_scan_page.template.js's renderRows): undefined always sorts last
// regardless of direction, so an inconsistent/sparse row set doesn't jump around when
// the sort direction flips.
const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows;
  const key = sortKey.value;
  const dir = sortDir.value;
  return [...props.rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
});

function formatCell(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
</script>
