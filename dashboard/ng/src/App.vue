<template>
  <div class="ng-root ng:text-text">
    <AppShell>
      <component :is="pageComponent" v-if="pageComponent" v-bind="route.params" />
      <div v-else class="ng:p-6 ng:text-muted ng:text-sm">Page not found.</div>
    </AppShell>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppShell from './layouts/AppShell.vue';
import { pageComponentFor, useNgRoute } from './router';

const route = useNgRoute();
const pageComponent = computed(() => pageComponentFor(route.value.name));
</script>
