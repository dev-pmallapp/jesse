<!--
  Target picker for a scan: "Basket" (one or more index universes from /universe-scan/options,
  labelled with the friendlier name + member count from /baskets/list when available) or
  "Stocks" (a free-form symbol list). Redesigned from the old dashboard_patches template's
  always-visible universe checklist + always-visible symbols textarea into a segmented
  either/or, matching this page's "run on a basket, or on hand-picked stocks" framing.

  Mutates `form` directly rather than emitting granular update events - this and its
  sibling scan/* form components all share one reactive `ScanFormState` object owned by
  ScanPage.vue, which keeps a ~20-field form from needing a matching wall of v-model/emit
  boilerplate. Vue reactivity propagates nested-property writes back to the owner fine;
  only reassigning the `form` prop itself would warn, and nothing here does that.
-->
<template>
  <div>
    <div class="ng:inline-flex ng:border ng:border-border ng:rounded-md ng:overflow-hidden ng:mb-2.5">
      <button
        type="button"
        class="ng:cursor-pointer ng:border-0 ng:px-3 ng:py-1.5 ng:text-[13px]"
        :class="form.mode === 'basket' ? 'ng:bg-primary ng:text-bg ng:font-semibold' : 'ng:bg-elevated ng:text-text'"
        @click="form.mode = 'basket'"
      >
        Basket
      </button>
      <button
        type="button"
        class="ng:cursor-pointer ng:border-0 ng:px-3 ng:py-1.5 ng:text-[13px]"
        :class="form.mode === 'stocks' ? 'ng:bg-primary ng:text-bg ng:font-semibold' : 'ng:bg-elevated ng:text-text'"
        @click="form.mode = 'stocks'"
      >
        Stocks
      </button>
    </div>

    <div v-if="form.mode === 'basket'">
      <div
        v-if="universes.length"
        class="ng:flex ng:flex-wrap ng:gap-x-3.5 ng:gap-y-1.5 ng:max-h-40 ng:overflow-y-auto ng:border ng:border-border ng:rounded-md ng:p-2"
      >
        <label
          v-for="name in universes"
          :key="name"
          class="ng:flex ng:items-center ng:gap-1.5 ng:text-[13px] ng:whitespace-nowrap ng:m-0"
        >
          <input type="checkbox" :value="name" :checked="form.selectedUniverses.includes(name)" @change="toggleUniverse(name)" />
          {{ basketLabel(name) }}
        </label>
      </div>
      <p v-else class="ng:text-muted ng:text-sm ng:m-0">No baskets available.</p>
    </div>

    <div v-else>
      <textarea
        v-model="form.symbolsText"
        rows="3"
        class="ng:w-full ng:border ng:border-border ng:rounded-md ng:bg-bg ng:text-text ng:px-2 ng:py-1.5 ng:text-[13px] ng:font-mono ng:resize-y"
        placeholder="RELIANCE, TCS, NSE:INFY (one per line or comma-separated)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Basket, ScanFormState } from '../../api/scan';

const props = defineProps<{
  form: ScanFormState;
  universes: string[];
  baskets: Basket[];
}>();

function toggleUniverse(name: string): void {
  const i = props.form.selectedUniverses.indexOf(name);
  if (i === -1) props.form.selectedUniverses.push(name);
  else props.form.selectedUniverses.splice(i, 1);
}

// A universe name is also a basket's canonical `name` (baskets_controller and
// universe_scan_controller both source it from research.list_universes()) - look up the
// matching basket purely for its nicer display + member count, falling back to the bare
// name when /baskets/list failed or hasn't loaded yet.
function basketLabel(name: string): string {
  const basket = props.baskets.find((b) => b.name === name);
  if (!basket || basket.member_count === null) return name;
  return `${name} (${basket.member_count})`;
}
</script>
