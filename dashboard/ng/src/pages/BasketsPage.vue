<template>
  <AppCard title="Baskets">
    <FormField label="Filter by name">
      <input
        v-model="filterText"
        type="text"
        placeholder="Search baskets..."
        class="ng:w-full ng:max-w-xs ng:bg-bg ng:border ng:border-border ng:rounded-md ng:px-2.5 ng:py-1.5 ng:text-[13px] ng:text-text"
      />
    </FormField>

    <div v-if="error" class="ng:mb-3">
      <Banner :message="error" tone="error" />
      <AppButton size="small" @click="load">Retry</AppButton>
    </div>

    <p v-else-if="loading" class="ng:text-muted ng:text-sm ng:m-0">Loading baskets...</p>

    <template v-else>
      <section class="ng:mb-4">
        <h2 class="ng:text-[13px] ng:font-medium ng:text-muted ng:mb-2 ng:mt-0">Index baskets</h2>
        <p v-if="!indexBaskets.length" class="ng:text-muted ng:text-sm ng:m-0">No baskets match "{{ filterText }}".</p>
        <div v-else class="ng:grid ng:gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
          <BasketCard
            v-for="basket in indexBaskets"
            :key="basket.id"
            :basket="basket"
            @click="navigate(`/india/basket/${basket.id}`)"
          />
        </div>
      </section>

      <section>
        <h2 class="ng:text-[13px] ng:font-medium ng:text-muted ng:mb-2 ng:mt-0">Mutual funds</h2>
        <div v-if="mfBaskets.length" class="ng:grid ng:gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
          <BasketCard
            v-for="basket in mfBaskets"
            :key="basket.id"
            :basket="basket"
            @click="navigate(`/india/basket/${basket.id}`)"
          />
        </div>
        <AppCard v-else>
          <p class="ng:text-muted ng:text-sm ng:m-0">
            Mutual fund scheme holdings will appear here once AMFI holdings data is wired up.
          </p>
        </AppCard>
      </section>
    </template>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppCard from '../components/AppCard.vue';
import Banner from '../components/Banner.vue';
import BasketCard from '../components/baskets/BasketCard.vue';
import FormField from '../components/FormField.vue';
import { listBaskets, type BasketSummary } from '../api/baskets';
import { useNgNavigate } from '../router';

const navigate = useNgNavigate();

const baskets = ref<BasketSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const filterText = ref('');

const filtered = computed(() => {
  const q = filterText.value.trim().toLowerCase();
  if (!q) return baskets.value;
  return baskets.value.filter((b) => b.name.toLowerCase().includes(q));
});
const indexBaskets = computed(() => filtered.value.filter((b) => b.kind === 'index'));
const mfBaskets = computed(() => filtered.value.filter((b) => b.kind === 'mf'));

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const res = await listBaskets();
    baskets.value = res.baskets;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load baskets.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
