<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { FsNodeRecord } from '~/types/graph';
import { useGraphApi } from '~/composables/useGraphApi';
import { useWorkspaceStore } from '~/composables/useWorkspaceStore';
import Grid from '~/components/ds/layout/Grid.vue';
import GitTopBar from '~/components/GitTopBar.vue';
import TableExplorer from '~/components/tableExplorer.vue';
import EntitySidebar from '~/components/EntitySidebar.vue';
import MergeRequestsModal from '~/components/MergeRequestsModal.vue';

const api = useGraphApi();
const ws = useWorkspaceStore();
const router = useRouter();

const search = ref('');
const typeFilter = ref<string>('all');
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(1);
const sortBy = ref('name');
const sortDir = ref<'asc' | 'desc'>('asc');
const loading = ref(false);
const records = ref<FsNodeRecord[]>([]);

async function loadPage() {
  loading.value = true;
  try {
    const res = await api.fetchFsPaginated({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value,
      type: typeFilter.value === 'all' ? undefined : typeFilter.value,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    });
    records.value = res.items;
    total.value = res.total;
    totalPages.value = res.totalPages;
    page.value = res.page;
  } finally {
    loading.value = false;
  }
}

function handleSort(field: string) {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortDir.value = 'asc';
  }
  page.value = 1;
  loadPage();
}

let timer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    loadPage();
  }, 200);
});

onMounted(async () => {
  await Promise.all([ws.initWorkspace(), loadPage()]);
});
</script>

<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <GitTopBar
      :authors="ws.authors.value"
      :current-user="ws.currentUser.value"
      :view-mode="'files'"
      :open-mr-count="ws.openMergeRequests.value.length"
      :pending-my-approval-count="ws.pendingMyApprovalCount.value"
      active-dataset-name="Storage Nodes Table"
      :total-records="total"
      @update:view-mode="mode => { ws.viewMode.value = mode; router.push('/'); }"
      @switch-user="id => (ws.currentUserId.value = id)"
      @open-mr-drawer="ws.mrDrawerOpen.value = true"
      @open-create-mr="ws.openProposeMrForEntity(ws.globalNodes.value[0]?.entity!)"
    />

    <Grid
      :variant="ws.rightToolOpen.value && (ws.inspectedFile.value || ws.inspectedEntity.value) ? 'x_1fr_auto' : 'full'"
      full-height
      clip
    >
      <TableExplorer
        :records="records"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        :search="search"
        :type-filter="typeFilter"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :loading="loading"
        :selected-id="ws.inspectedFile.value?.id"
        @update:search="search = $event"
        @update:type-filter="typeFilter = $event; page = 1; loadPage()"
        @update:page-size="pageSize = $event; page = 1; loadPage()"
        @page-change="page = $event; loadPage()"
        @toggle-sort="handleSort"
        @inspect="ws.inspectFileNode"
        @propose-mr="ws.openProposeMrForFile"
        @refresh="loadPage"
      />

      <EntitySidebar
        v-if="ws.rightToolOpen.value && (ws.inspectedFile.value || ws.inspectedEntity.value)"
        :entity="ws.inspectedEntity.value"
        :file-node="ws.inspectedFile.value"
        :subgraph="ws.inspectedSubgraph.value"
        :navigation-history="ws.navigationHistory.value"
        @close="ws.closeInspector()"
        @select-entity="e => ws.inspectEntityById(e.id)"
        @navigate-id="id => ws.inspectEntityById(id)"
        @propose-mr-entity="ws.openProposeMrForEntity"
        @propose-mr-file="ws.openProposeMrForFile"
        @save-file="async p => { await ws.saveFsItemContent(p.id, p.content_json); await loadPage(); }"
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
      @review-mr="async p => { await ws.reviewMergeRequest(p); await loadPage(); }"
      @create-mr="ws.submitMergeRequest"
      @inspect-target="id => ws.inspectEntityById(id)"
    />
  </Grid>
</template>