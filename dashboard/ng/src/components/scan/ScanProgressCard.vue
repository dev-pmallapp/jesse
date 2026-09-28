<!-- Progress + cancel for the session currently being polled - only shown while
     session.status === 'running' (see ScanPage.vue). -->
<template>
  <AppCard title="Progress">
    <template #actions>
      <AppButton variant="danger" size="small" @click="$emit('cancel')">Cancel</AppButton>
    </template>
    <p class="ng:text-muted ng:text-xs ng:mb-2 ng:mt-0">Session {{ session.id }}</p>
    <ProgressBar :percent="pct" />
    <p class="ng:text-muted ng:text-xs ng:mt-2 ng:mb-0">
      phase: {{ session.progress.phase ?? '-' }} &middot; {{ session.progress.done }} / {{ session.progress.total }}
      <span v-if="session.progress.current">&middot; current: {{ session.progress.current }}</span>
    </p>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '../AppButton.vue';
import AppCard from '../AppCard.vue';
import ProgressBar from '../ProgressBar.vue';
import type { ScanSession } from '../../api/scan';

const props = defineProps<{ session: ScanSession }>();
defineEmits<{ cancel: [] }>();

const pct = computed(() => {
  const p = props.session.progress;
  return p.total ? Math.round((100 * p.done) / p.total) : 0;
});
</script>
