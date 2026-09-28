<!-- Past-sessions history: ports universe_scan_page.template.js's renderSessionsList
     (load/delete-with-confirm) onto DataTable + StatusPill. Refresh lives on the
     parent AppCard's actions slot (ScanPage.vue owns the fetch). -->
<template>
  <DataTable :columns="columns" :rows="rows" :row-key="(r) => r.id" empty-text="No scans yet.">
    <template #cell-created_at="{ row }">{{ fmtDate(row.created_at as string) }}</template>
    <template #cell-status="{ row }">
      <StatusPill :status="row.status as string" />
    </template>
    <template #cell-actions="{ row }">
      <div class="ng:flex ng:gap-2.5">
        <AppButton variant="link" @click="$emit('open', row.id as string)">Load</AppButton>
        <AppButton variant="link" @click="onDelete(row.id as string)">Delete</AppButton>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '../AppButton.vue';
import DataTable, { type DataTableColumn } from '../DataTable.vue';
import StatusPill from '../StatusPill.vue';
import { displayTicker, fmtDate } from '../../utils/format';
import type { ScanSessionSummary } from '../../api/scan';

const props = defineProps<{ sessions: ScanSessionSummary[] }>();
const emit = defineEmits<{ open: [id: string]; delete: [id: string] }>();

const columns: DataTableColumn[] = [
  { key: 'created_at', label: 'Created', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'progress', label: 'Progress', sortable: false },
  { key: 'target', label: 'Target', sortable: false },
  { key: 'strategies', label: 'Strategies', sortable: false },
  { key: 'row_count', label: 'Rows', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

// Flattened, DataTable-friendly view of each session summary - `target` folds
// universes/symbols (whichever the run used) into one column matching this page's
// basket-or-stocks framing, rather than two mostly-empty columns.
interface SessionRow extends Record<string, unknown> {
  id: string;
  created_at: string;
  status: string;
  progress: string;
  target: string;
  strategies: string;
  row_count: number;
}

const rows = computed<SessionRow[]>(() =>
  props.sessions.map((s) => {
    const p = s.progress;
    const cfg = s.config_summary;
    // Universes are basket/index names (e.g. "NIFTY100 ALPHA 30") - display as-is.
    // Explicit stock picks are raw Jesse internal symbols (e.g. "RELIANCE-INR") - run
    // through displayTicker so this column reads "NSE:RELIANCE" like every other
    // ticker in the app, not the internal encoding.
    const usingUniverses = cfg.universes && cfg.universes.length > 0;
    const target = usingUniverses
      ? cfg.universes!
      : (cfg.symbols ?? []).map((sym) => displayTicker(sym, cfg.exchange));
    return {
      id: s.id,
      created_at: s.created_at,
      status: s.status,
      progress: p && p.total ? `${p.done} / ${p.total}${p.phase ? ` (${p.phase})` : ''}` : '-',
      target: target.length ? target.join(', ') : '-',
      strategies: cfg.strategies && cfg.strategies.length ? cfg.strategies.join(', ') : '-',
      row_count: s.row_count,
    };
  }),
);

function onDelete(id: string): void {
  // window.confirm matches the old template's own delete flow - a stray click on a
  // session someone's actively looking at shouldn't silently remove it.
  if (!window.confirm(`Delete session ${id}?`)) return;
  emit('delete', id);
}
</script>
