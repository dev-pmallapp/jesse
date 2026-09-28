<template>
  <div v-if="error && !detail">
    <Banner :message="error" tone="error" />
    <AppButton size="small" @click="load()">Retry</AppButton>
  </div>

  <template v-else>
    <AppCard>
      <p v-if="loading && !detail" class="ng:text-muted ng:text-sm ng:m-0">Loading basket...</p>
      <template v-else-if="detail">
        <div class="ng:flex ng:items-start ng:justify-between ng:gap-3 ng:flex-wrap">
          <div>
            <div class="ng:flex ng:items-center ng:gap-2 ng:mb-1">
              <h2 class="ng:text-[15px] ng:font-semibold ng:text-highlighted ng:m-0">{{ detail.name }}</h2>
              <StatusPill tone="default">{{ detail.kind === 'mf' ? 'MF' : 'Index' }}</StatusPill>
            </div>
            <p class="ng:text-[12.5px] ng:text-muted ng:m-0">
              Snapshot: {{ detail.snapshot_date }}
              <template v-if="detail.benchmark">
                &middot; Benchmark:
                <button
                  v-if="detail.benchmark.startsWith('NSE:')"
                  type="button"
                  class="ng:bg-transparent ng:border-none ng:p-0 ng:text-primary ng:underline ng:cursor-pointer ng:text-[12.5px]"
                  @click="navigate(`/india/stock/${encodeURIComponent(detail.benchmark)}`)"
                >
                  {{ detail.benchmark }}
                </button>
                <span v-else>{{ detail.benchmark }}</span>
              </template>
            </p>
          </div>

          <div class="ng:flex ng:flex-col ng:items-end ng:gap-2">
            <div class="ng:flex ng:items-end ng:gap-2 ng:flex-wrap">
              <FormField label="As of">
                <input
                  v-model="asOf"
                  type="date"
                  class="ng:bg-bg ng:border ng:border-border ng:rounded-md ng:px-2 ng:py-1 ng:text-[12.5px] ng:text-text"
                  @change="load()"
                />
              </FormField>
              <AppButton size="small" :disabled="loading" @click="load({ refresh: true })">Refresh membership</AppButton>
            </div>
            <div class="ng:flex ng:gap-2">
              <AppButton size="small" variant="primary" @click="navigate(`/india/scan?basket=${id}`)">Scan this basket</AppButton>
              <AppButton size="small" @click="navigate(`/india/portfolio?basket=${id}`)">Backtest as portfolio</AppButton>
            </div>
          </div>
        </div>
      </template>
    </AppCard>

    <Banner
      v-if="detail?.used_current_members"
      tone="warn"
      message="Showing today's current membership - no historical snapshot exists at or before this date, so returns before today may carry survivorship bias (delisted/renamed members are invisible)."
    />
    <Banner v-if="error && detail" :message="error" tone="error" />
    <AppButton v-if="error && detail" size="small" @click="load()">Retry</AppButton>

    <div v-if="detail" class="ng:grid ng:grid-cols-1 ng:md:grid-cols-[260px_1fr] ng:gap-3.5 ng:items-start">
      <div class="ng:flex ng:flex-col ng:gap-3.5">
        <CoverageCard :coverage="detail.coverage" />
        <IndustryBreakdown
          :industries="detail.industries"
          :total="detail.members.length"
          :selected="selectedIndustry"
          @select="selectedIndustry = $event"
        />
      </div>

      <!-- min-w-0: grid items default to min-width:auto, which lets this card's own
           content (the members table) force the grid track - and the whole page -
           wider than the viewport instead of the table's own ng:overflow-x-auto
           wrapper scrolling internally. -->
      <AppCard title="Members" class="ng:min-w-0">
        <MembersTable :members="filteredMembers" :total-count="detail.members.length" @select="onSelectMember" />
      </AppCard>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import FormField from '../components/FormField.vue';
import StatusPill from '../components/StatusPill.vue';
import CoverageCard from '../components/baskets/CoverageCard.vue';
import IndustryBreakdown from '../components/baskets/IndustryBreakdown.vue';
import MembersTable from '../components/baskets/MembersTable.vue';
import { getBasket, type BasketDetail } from '../api/baskets';
import { useNgNavigate } from '../router';

// Bound from the matched route's params (see router.ts's `basket-detail` pattern
// `/india/basket/:id`).
const props = defineProps<{ id?: string }>();
const navigate = useNgNavigate();

const detail = ref<BasketDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const asOf = ref('');
const selectedIndustry = ref<string | null>(null);

const filteredMembers = computed(() => {
  if (!detail.value) return [];
  if (!selectedIndustry.value) return detail.value.members;
  return detail.value.members.filter((m) => m.industry === selectedIndustry.value);
});

async function load(opts: { refresh?: boolean } = {}): Promise<void> {
  if (!props.id) return;
  loading.value = true;
  error.value = null;
  try {
    // Keep any previously-loaded `detail` visible across a reload (as-of change /
    // refresh) instead of clearing it first - avoids a full-page flash back to the
    // "Loading basket..." state for what's usually a quick re-fetch.
    detail.value = await getBasket({ id: props.id, as_of: asOf.value || undefined, refresh: opts.refresh });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load basket.';
  } finally {
    loading.value = false;
  }
}

// A route change swaps `id` in place (App.vue reuses this component instance across
// `/india/basket/:id` navigations) rather than remounting it - reset all per-basket
// state before fetching the new one.
watch(
  () => props.id,
  () => {
    detail.value = null;
    asOf.value = '';
    selectedIndustry.value = null;
    load();
  },
);

function onSelectMember(ticker: string): void {
  navigate(`/india/stock/${encodeURIComponent(ticker)}`);
}

onMounted(load);
</script>
