<!-- Saved Portfolio runs: load one back into the results view, or delete it (with a
     confirm prompt, matching the old template's `window.confirm`). -->
<template>
  <AppCard title="Saved runs">
    <template #actions>
      <AppButton size="small" type="button" @click="$emit('refresh')">Refresh</AppButton>
    </template>
    <DataTable :columns="columns" :rows="runs" :row-key="(r) => r.id" empty-text="No saved runs yet.">
      <template #cell-created_at="{ value }">{{ fmtDate(value as number) }}</template>
      <template #cell-config="{ row }">{{ runLabel(row.config) }}</template>
      <template #cell-metrics="{ row }">{{ fmtPct(row.metrics?.total_return_pct) }}</template>
      <template #cell-actions="{ row }">
        <span class="ng:flex ng:gap-2">
          <AppButton variant="link" type="button" @click="$emit('load', row.id)">Load</AppButton>
          <AppButton variant="link" type="button" @click="onDelete(row.id)">Delete</AppButton>
        </span>
      </template>
    </DataTable>
  </AppCard>
</template>

<script setup lang="ts">
import AppButton from '../AppButton.vue';
import AppCard from '../AppCard.vue';
import DataTable, { type DataTableColumn } from '../DataTable.vue';
import { fmtDate, fmtPct } from '../../utils/format';
import { runLabel, type RunSummary } from '../../api/portfolio';

defineProps<{ runs: RunSummary[] }>();
const emit = defineEmits<{ load: [string]; delete: [string]; refresh: [] }>();

function onDelete(id: string): void {
  if (!window.confirm('Delete this saved run?')) return;
  emit('delete', id);
}

const columns: DataTableColumn[] = [
  { key: 'created_at', label: 'Created' },
  { key: 'config', label: 'Basket' },
  { key: 'metrics', label: 'Return %' },
  { key: 'actions', label: 'Actions' },
];
</script>
