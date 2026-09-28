<!--
  Shared chrome for every India sub-page: a heading and a tab bar for the four
  top-level sections (the sidebar link for each already points here - see
  scripts/patch_dashboard.py's NAV_ITEMS - this tab bar is the *in-app* switcher
  between them once you're already inside /india/*).
-->
<template>
  <div class="ng:max-w-[1100px] ng:mx-auto ng:p-4">
    <div class="ng:flex ng:items-center ng:justify-between ng:mb-3.5">
      <h1 class="ng:text-xl ng:font-semibold ng:text-highlighted ng:m-0">India</h1>
    </div>
    <nav class="ng:flex ng:gap-1.5 ng:mb-3.5 ng:border-b ng:border-border">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        type="button"
        class="ng:border-0 ng:border-b-2 ng:bg-transparent ng:cursor-pointer ng:px-1 ng:py-2 ng:text-[13px] ng:-mb-px"
        :class="isActive(tab) ? 'ng:border-primary ng:text-highlighted ng:font-semibold' : 'ng:border-transparent ng:text-muted'"
        @click="navigate(tab.path)"
      >
        {{ tab.label }}
      </button>
    </nav>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useNgNavigate, useNgRoute } from '../router';

const route = useNgRoute();
const navigate = useNgNavigate();

const tabs: { label: string; path: string; routeNames: string[] }[] = [
  { label: 'Stocks', path: '/india/stocks', routeNames: ['stocks', 'stock-detail'] },
  { label: 'Baskets', path: '/india/baskets', routeNames: ['baskets', 'basket-detail'] },
  { label: 'Scan', path: '/india/scan', routeNames: ['scan'] },
  { label: 'Portfolio', path: '/india/portfolio', routeNames: ['portfolio'] },
];

// A detail page (stock/:symbol, basket/:id) belongs to its list tab even though its
// own path isn't a literal prefix match of the tab's path - match by route `name`,
// not raw path prefix.
function isActive(tab: (typeof tabs)[number]): boolean {
  return tab.routeNames.includes(route.value.name);
}
</script>
