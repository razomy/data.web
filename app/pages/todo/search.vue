<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Entity, EntityField } from '~/razomy/abstractions/graph';
import { useGraphApi } from '~/composables/useGraphApi';
import { useWorkspaceStore } from '~/composables/useWorkspaceStore';
import {Grid} from '@razomy/vue';
import {Container} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Button} from '@razomy/vue';
import {Badge} from '@razomy/vue';
import GitTopBar from '~/components/GitTopBar.vue';
import SearchResultCard from '~/components/SearchResultCard.vue';
import EntitySidebar from '~/components/EntitySidebar.vue';
import MergeRequestsModal from '~/components/MergeRequestsModal.vue';
import {AppSearchInput} from '@razomy/vue';

const api = useGraphApi();
const ws = useWorkspaceStore();
const router = useRouter();

const EXAMPLE_QUERIES = [
  'graph', 'engineer', 'San Francisco', 'enterprise', '2026', 'Neo4j', 'platform', 'ISO',
];

const query = ref('');
const typeFilter = ref('All');
const sortBy = ref<'relevance' | 'name' | 'fields'>('relevance');

const allTypes = ref<string[]>(['All', 'Person', 'Organization', 'Product', 'Event', 'Document', 'Concept']);
const results = ref<{ entity: Entity; score: number; matches: { field: EntityField; snippet: string }[] }[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(15);
const totalPages = ref(1);
const loading = ref(false);

async function executeSearch() {
  loading.value = true;
  try {
    const res = await api.searchGraph({
      q: query.value,
      type: typeFilter.value,
      sortBy: sortBy.value,
      page: page.value,
      pageSize: pageSize.value,
    });
    results.value = res.items;
    total.value = res.total;
    totalPages.value = res.totalPages;
    page.value = res.page;
    if (res.types && res.types.length > 0) {
      allTypes.value = res.types;
    }
  } finally {
    loading.value = false;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch([query, typeFilter, sortBy], () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    executeSearch();
  }, 180);
});

function goToPage(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  executeSearch();
}

async function handleSelectEntity(entity: Entity, fieldKey?: string) {
  await ws.inspectEntityById(entity.id, fieldKey);
}

onMounted(async () => {
  await Promise.all([ws.initWorkspace(), executeSearch()]);
});
</script>

<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <GitTopBar
      :authors="ws.authors.value"
      :current-user="ws.currentUser.value"
      :view-mode="'search'"
      :open-mr-count="ws.openMergeRequests.value.length"
      :pending-my-approval-count="ws.pendingMyApprovalCount.value"
      active-dataset-name="Full-Text Graph Search"
      :total-records="total"
      @update:view-mode="mode => { ws.viewMode.value = mode; router.push('/'); }"
      @switch-user="id => (ws.currentUserId.value = id)"
      @open-mr-drawer="ws.mrDrawerOpen.value = true"
      @open-create-mr="ws.openProposeMrForEntity(ws.inspectedEntity.value || ws.globalNodes.value[0]?.entity!)"
    />

    <Grid
      :variant="ws.rightToolOpen.value && ws.inspectedEntity.value ? 'x_1fr_auto' : 'full'"
      full-height
      clip
    >
      <Grid variant="y" scrollable full-height>
        <Container gap="md" padding="lg">
          <Grid variant="y" gap="xs">
            <Body variant="xsMono" color="muted">/search</Body>
            <Body as="h1" variant="xlBold">Multi-Modal Database Search</Body>
            <Body variant="sRegular" color="muted">
              Full-text indexing across relational entities, attributes, Git owners, and graph references
            </Body>
          </Grid>

          <AppSearchInput
            v-model="query"
            placeholder="Search entities, roles, tags, technologies, authors..."
            @clear="query = ''"
          />

          <Grid v-if="!query" variant="x_start" gap="xs">
            <Body variant="xxsMono" color="muted">Suggested:</Body>
            <Badge
              v-for="q in EXAMPLE_QUERIES"
              :key="q"
              :label="q"
              role="neutral"
              clickable
              @click="query = q"
            />
          </Grid>

          <Grid variant="x_between" gap="sm">
            <Grid variant="x_start" gap="xss">
              <Badge
                v-for="type in allTypes"
                :key="type"
                :label="type"
                :entity-type="type === 'All' ? undefined : type"
                :active="typeFilter === type"
                clickable
                @click="typeFilter = type"
              />
            </Grid>

            <Grid variant="x" gap="xss">
              <Button size="xs" :variant="sortBy === 'relevance' ? 'flat' : 'tonal'" @click="sortBy = 'relevance'">
                Relevance
              </Button>
              <Button size="xs" :variant="sortBy === 'name' ? 'flat' : 'tonal'" @click="sortBy = 'name'">
                Name
              </Button>
              <Button size="xs" :variant="sortBy === 'fields' ? 'flat' : 'tonal'" @click="sortBy = 'fields'">
                Fields
              </Button>
            </Grid>
          </Grid>

          <Grid variant="x_between">
            <Body variant="xxsMono" color="muted">
              {{ total }} result{{ total !== 1 ? 's' : '' }}
              <template v-if="query"> for "{{ query }}"</template>
            </Body>
            <Body v-if="loading" variant="xxsMono" color="primary">Searching ORM...</Body>
          </Grid>

          <Grid variant="y" gap="sm">
            <SearchResultCard
              v-for="{ entity, score, matches } in results"
              :key="entity.id"
              :entity="entity"
              :score="score"
              :matches="matches"
              :query="query"
              :is-selected="ws.inspectedEntity.value?.id === entity.id"
              @click="handleSelectEntity(entity)"
              @match-click="fKey => handleSelectEntity(entity, fKey)"
            />
          </Grid>

          <Grid v-if="totalPages > 1" variant="x_between" padding="sm" border="t">
            <Body variant="xsMono" color="muted">Page {{ page }} of {{ totalPages }}</Body>
            <Grid variant="x" gap="xs">
              <Button variant="tonal" size="sm" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">
                ← Prev
              </Button>
              <Button variant="tonal" size="sm" :disabled="page >= totalPages || loading" @click="goToPage(page + 1)">
                Next →
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Grid>

      <EntitySidebar
        v-if="ws.rightToolOpen.value && ws.inspectedEntity.value"
        :entity="ws.inspectedEntity.value"
        :subgraph="ws.inspectedSubgraph.value"
        :active-field-key="ws.activeFieldKey.value"
        :navigation-history="ws.navigationHistory.value"
        @close="ws.closeInspector()"
        @select-entity="e => handleSelectEntity(e)"
        @navigate-id="id => ws.inspectEntityById(id)"
        @propose-mr-entity="ws.openProposeMrForEntity"
        @propose-mr-file="ws.openProposeMrForFile"
      />
    </Grid>

    <MergeRequestsModal
      :drawer-open="ws.mrDrawerOpen.value"
      :create-open="ws.createMrDialogOpen.value"
      :merge-requests="ws.mergeRequests.value"
      :current-user="ws.currentUser.value"
      :target-entity="ws.mrTargetEntity.value"
      :target-file="ws.mrTargetFile.value"
      :available-entities="ws.globalNodes.value.map(n => n.entity)"
      :loading="ws.loadingMr.value"
      @update:drawer-open="ws.mrDrawerOpen.value = $event"
      @update:create-open="ws.createMrDialogOpen.value = $event"
      @review-mr="async p => { await ws.reviewMergeRequest(p); await executeSearch(); }"
      @create-mr="ws.submitMergeRequest"
      @inspect-target="id => ws.inspectEntityById(id)"
    />
  </Grid>
</template>
