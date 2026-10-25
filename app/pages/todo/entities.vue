<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useWorkspaceStore } from '~/composables/useWorkspaceStore';
import type { Entity, TableRow } from '~/razomy/abstractions/graph';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Button from '~/razomy/ui-vue/button/Button.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';
import GitTopBar from '~/components/GitTopBar.vue';
import LeftDatasetSidebar from '~/components/LeftDatasetSidebar.vue';
import VirtualTable from '~/components/VirtualTable.vue';
import EntityCardsGrid from '~/components/EntityCardsGrid.vue';
import EntitySidebar from '~/components/EntitySidebar.vue';
import MergeRequestsModal from '~/components/MergeRequestsModal.vue';
import AppSearchInput from '~/razomy/ui-vue/AppSearchInput.vue';

const ws = useWorkspaceStore();

const TYPES = ['All', 'Person', 'Organization', 'Product', 'Event', 'Document', 'Concept'];

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
watch(
  () => ws.searchQuery.value,
  () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      ws.page.value = 1;
      ws.loadEntitiesPage();
    }, 200);
  }
);

function setTypeFilter(type: string) {
  ws.typeFilter.value = type;
  ws.page.value = 1;
  ws.loadEntitiesPage();
}

function goToPage(p: number) {
  if (p < 1 || p > ws.totalPages.value) return;
  ws.page.value = p;
  ws.loadEntitiesPage();
}

async function onRowClick(row: TableRow, fieldKey?: string) {
  await ws.inspectEntityById(row.entityId, fieldKey);
}

async function handleSelectEntity(entity: Entity) {
  await ws.inspectEntityById(entity.id);
}

onMounted(async () => {
  await ws.initWorkspace();
  if (ws.viewMode.value !== 'table' && ws.viewMode.value !== 'cards') {
    ws.viewMode.value = 'table';
  }
});
</script>

<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <GitTopBar
      :authors="ws.authors.value"
      :current-user="ws.currentUser.value"
      :view-mode="ws.viewMode.value"
      :open-mr-count="ws.openMergeRequests.value.length"
      :pending-my-approval-count="ws.pendingMyApprovalCount.value"
      :active-dataset-name="ws.activeDataset.value?.name"
      :total-records="ws.totalRows.value"
      @update:view-mode="mode => (ws.viewMode.value = mode === 'cards' ? 'cards' : 'table')"
      @switch-user="id => (ws.currentUserId.value = id)"
      @open-mr-drawer="ws.mrDrawerOpen.value = true"
      @open-create-mr="ws.openProposeMrForEntity(ws.inspectedEntity.value || ws.globalNodes.value[0]?.entity!)"
    />

    <Grid
      :variant="ws.rightToolOpen.value && (ws.inspectedEntity.value || ws.inspectedFile.value) ? 'x_auto_1fr_auto' : 'x_auto_1fr'"
      full-height
      clip
    >
      <LeftDatasetSidebar
        :datasets="ws.datasets.value"
        :authors="ws.authors.value"
        :active-dataset-id="ws.activeDatasetId.value"
        :active-type-filter="ws.typeFilter.value"
        :active-author-filter="ws.activeAuthorFilter.value"
        :type-counts="ws.typeCounts.value"
        :fs-folders="ws.fsItems.value"
        :current-folder-id="ws.currentFolderId.value"
        @select-dataset="ws.selectDataset"
        @select-type="setTypeFilter"
        @select-author="id => { ws.activeAuthorFilter.value = id; ws.page.value = 1; ws.loadEntitiesPage(); }"
        @select-folder="ws.loadFsFolder"
      />

      <Grid variant="y_header_main_footer" full-height clip surface="default">
        <Grid variant="x_between" padding="xs" surface="panel" border="b">
          <Grid variant="x_start" gap="xss">
            <Badge
              v-for="type in TYPES"
              :key="type"
              :label="`${type} (${(ws.typeCounts.value[type] || 0).toLocaleString()})`"
              :entity-type="type === 'All' ? undefined : type"
              :active="ws.typeFilter.value === type"
              clickable
              @click="setTypeFilter(type)"
            />
          </Grid>

          <Grid variant="x" gap="xs">
            <AppSearchInput
              v-model="ws.searchQuery.value"
              placeholder="Search all attributes..."
              @clear="ws.searchQuery.value = ''"
            />
            <Button
              size="xs"
              :variant="ws.viewMode.value === 'table' ? 'flat' : 'tonal'"
              prepend-icon="mdi-table"
              @click="ws.viewMode.value = 'table'"
            >
              Table
            </Button>
            <Button
              size="xs"
              :variant="ws.viewMode.value === 'cards' ? 'flat' : 'tonal'"
              prepend-icon="mdi-view-grid"
              @click="ws.viewMode.value = 'cards'"
            >
              Cards
            </Button>
          </Grid>
        </Grid>

        <EntityCardsGrid
          v-if="ws.viewMode.value === 'cards'"
          :rows="ws.rows.value"
          :selected-entity-id="ws.inspectedEntity.value?.id"
          @row-click="onRowClick"
        />
        <VirtualTable
          v-else
          :rows="ws.rows.value"
          :type-filter="ws.typeFilter.value"
          :search-query="ws.searchQuery.value"
          :selected-row-id="ws.inspectedEntity.value?.id"
          @row-click="onRowClick"
        />

        <Grid variant="x_between" padding="xs" surface="elevated" border="t">
          <Body variant="xxsMono" color="muted">
            Showing {{ ws.totalRows.value === 0 ? 0 : (ws.page.value - 1) * ws.pageSize.value + 1 }}–{{
              Math.min(ws.page.value * ws.pageSize.value, ws.totalRows.value)
            }}
            of {{ ws.totalRows.value.toLocaleString() }} entities
          </Body>
          <Grid variant="x" gap="xs">
            <Button variant="tonal" size="xs" :disabled="ws.page.value <= 1" @click="goToPage(ws.page.value - 1)">
              ← Prev
            </Button>
            <Body variant="xsMono">Page {{ ws.page.value }} / {{ ws.totalPages.value }}</Body>
            <Button variant="tonal" size="xs" :disabled="ws.page.value >= ws.totalPages.value" @click="goToPage(ws.page.value + 1)">
              Next →
            </Button>
          </Grid>
        </Grid>
      </Grid>

      <EntitySidebar
        v-if="ws.rightToolOpen.value && (ws.inspectedEntity.value || ws.inspectedFile.value)"
        :entity="ws.inspectedEntity.value"
        :file-node="ws.inspectedFile.value"
        :subgraph="ws.inspectedSubgraph.value"
        :active-field-key="ws.activeFieldKey.value"
        :navigation-history="ws.navigationHistory.value"
        @close="ws.closeInspector()"
        @select-entity="handleSelectEntity"
        @navigate-id="id => ws.inspectEntityById(id)"
        @propose-mr-entity="ws.openProposeMrForEntity"
        @propose-mr-file="ws.openProposeMrForFile"
        @save-file="p => ws.saveFsItemContent(p.id, p.content_json)"
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
      @review-mr="ws.reviewMergeRequest"
      @create-mr="ws.submitMergeRequest"
      @inspect-target="id => ws.inspectEntityById(id)"
    />
  </Grid>
</template>
