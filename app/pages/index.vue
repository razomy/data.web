<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useWorkspaceStore } from '~/composables/useWorkspaceStore';
import type { Entity, TableRow } from '~/types/graph';
import Grid from '~/components/ds/layout/Grid.vue';
import Container from '~/components/ds/layout/Container.vue';
import Body from '~/components/ds/typography/Body.vue';
import Button from '~/components/ds/button/Button.vue';
import Badge from '~/components/ds/elements/Badge.vue';
import GitTopBar from '~/components/GitTopBar.vue';
import LeftDatasetSidebar from '~/components/LeftDatasetSidebar.vue';
import VirtualTable from '~/components/VirtualTable.vue';
import EntityCardsGrid from '~/components/EntityCardsGrid.vue';
import FileExplorer from '~/components/FileExplorer.vue';
import GlobalGraphCanvas from '~/components/GlobalGraphCanvas.vue';
import TextCorpusView from '~/components/TextCorpusView.vue';
import SearchResultCard from '~/components/SearchResultCard.vue';
import EntitySidebar from '~/components/EntitySidebar.vue';
import MergeRequestsModal from '~/components/MergeRequestsModal.vue';
import AppSearchInput from '~/components/ui/AppSearchInput.vue';

const ws = useWorkspaceStore();

const TYPES = ['All', 'Person', 'Organization', 'Product', 'Event', 'Document', 'Concept'];

const availableEntitiesForMr = computed<Entity[]>(() => {
  return ws.globalNodes.value.map(n => n.entity);
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => ws.searchQuery.value,
  () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      ws.page.value = 1;
      ws.loadEntitiesPage();
      if (ws.viewMode.value === 'search') {
        ws.loadSearchResults();
      }
    }, 180);
  }
);

function handleSelectType(type: string) {
  ws.typeFilter.value = type;
  ws.page.value = 1;
  ws.loadEntitiesPage();
  ws.loadSearchResults();
}

function handleSelectAuthor(authorId: string) {
  ws.activeAuthorFilter.value = authorId;
  ws.page.value = 1;
  ws.loadEntitiesPage();
}

async function handleSelectFolderFromSidebar(folderId: string | null) {
  ws.activeDatasetId.value = 'ds-fs-root';
  ws.viewMode.value = 'files';
  await ws.loadFsFolder(folderId);
}

async function handleRowClick(row: TableRow, fieldKey?: string) {
  await ws.inspectEntityById(row.entityId, fieldKey);
}

async function handleEntitySelect(entity: Entity) {
  await ws.inspectEntityById(entity.id);
}

function goToPage(newPage: number) {
  if (newPage < 1 || newPage > ws.totalPages.value) return;
  ws.page.value = newPage;
  ws.loadEntitiesPage();
}

onMounted(async () => {
  await ws.initWorkspace();
  if (!ws.inspectedEntity.value && !ws.inspectedFile.value) {
    await ws.inspectEntityById('e1');
  }
});
</script>

<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <!-- 1. TOP GIT & VIEW SWITCHER BAR -->
    <GitTopBar
      :authors="ws.authors.value"
      :current-user="ws.currentUser.value"
      :view-mode="ws.viewMode.value"
      :open-mr-count="ws.openMergeRequests.value.length"
      :pending-my-approval-count="ws.pendingMyApprovalCount.value"
      :active-dataset-name="ws.activeDataset.value?.name"
      :total-records="ws.totalRows.value"
      @update:view-mode="mode => { ws.viewMode.value = mode; if (mode === 'search') ws.loadSearchResults(); }"
      @switch-user="id => (ws.currentUserId.value = id)"
      @open-mr-drawer="ws.mrDrawerOpen.value = true"
      @open-create-mr="ws.openProposeMrForEntity(ws.inspectedEntity.value || availableEntitiesForMr[0]!)"
    />

    <!-- 2. THREE-PANE JETBRAINS IDE WORKSPACE -->
    <Grid
      :variant="ws.rightToolOpen.value && (ws.inspectedEntity.value || ws.inspectedFile.value) ? 'x_auto_1fr_auto' : 'x_auto_1fr'"
      full-height
      clip
    >
      <!-- LEFT NAVIGATOR -->
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
        @select-type="handleSelectType"
        @select-author="handleSelectAuthor"
        @select-folder="handleSelectFolderFromSidebar"
      />

      <!-- CENTER MULTI-MODAL VIEWPORT -->
      <Grid variant="y_header_main_footer" full-height clip surface="default">
        <!-- Filter & Search Sub-Toolbar -->
        <Grid
          v-if="ws.viewMode.value !== 'files' && ws.viewMode.value !== 'graph'"
          variant="x_between"
          padding="xs"
          gap="sm"
          surface="panel"
          border="b"
        >
          <Grid variant="x_start" gap="xss">
            <Badge
              v-for="t in TYPES"
              :key="t"
              :label="`${t} (${(ws.typeCounts.value[t] || 0).toLocaleString()})`"
              :entity-type="t === 'All' ? undefined : t"
              :active="ws.typeFilter.value === t"
              clickable
              @click="handleSelectType(t)"
            />
          </Grid>

          <Grid variant="x" gap="xs">
            <AppSearchInput
              v-model="ws.searchQuery.value"
              placeholder="Filter records, attributes, owners..."
              @clear="ws.searchQuery.value = ''"
            />
            <Button
              icon="mdi-refresh"
              variant="tonal"
              size="xs"
              color="primary"
              :loading="ws.loadingData.value"
              @click="ws.loadEntitiesPage()"
            />
          </Grid>
        </Grid>
        <div v-else />

        <!-- VIEW MODE A: TABLE -->
        <VirtualTable
          v-if="ws.viewMode.value === 'table'"
          :rows="ws.rows.value"
          :type-filter="ws.typeFilter.value"
          :search-query="ws.searchQuery.value"
          :selected-row-id="ws.inspectedEntity.value?.id"
          @row-click="handleRowClick"
        />

        <!-- VIEW MODE B: CARDS -->
        <EntityCardsGrid
          v-else-if="ws.viewMode.value === 'cards'"
          :rows="ws.rows.value"
          :selected-entity-id="ws.inspectedEntity.value?.id"
          @row-click="handleRowClick"
        />

        <!-- VIEW MODE C: FILE SYSTEM -->
        <FileExplorer
          v-else-if="ws.viewMode.value === 'files'"
          :files="ws.fsItems.value"
          :breadcrumb-items="ws.fsBreadcrumbs.value"
          :current-folder-id="ws.currentFolderId.value"
          :selected-file-id="ws.inspectedFile.value?.id"
          :loading="ws.loadingFs.value"
          @navigate-folder="ws.loadFsFolder"
          @select-file="ws.inspectFileNode"
          @create-node="ws.createFsItem"
          @rename-node="p => ws.renameFsItem(p.id, p.name)"
          @move-node="p => ws.moveFsItem(p.id, p.parentId)"
          @delete-node="f => ws.deleteFsItem(f.id)"
          @propose-mr="ws.openProposeMrForFile"
        />

        <!-- VIEW MODE D: KNOWLEDGE GRAPH -->
        <GlobalGraphCanvas
          v-else-if="ws.viewMode.value === 'graph'"
          :nodes="ws.globalNodes.value"
          :edges="ws.globalEdges.value"
          :selected-entity-id="ws.inspectedEntity.value?.id"
          :loading="ws.loadingGraph.value"
          @select-entity="handleEntitySelect"
          @reset="ws.loadGlobalGraph()"
        />

        <!-- VIEW MODE E: DOCS & CROSS-REFERENCES -->
        <TextCorpusView
          v-else-if="ws.viewMode.value === 'text'"
          :rows="ws.rows.value"
          :selected-entity-id="ws.inspectedEntity.value?.id"
          @row-click="handleRowClick"
          @preview-entity="id => ws.inspectEntityById(id)"
        />

        <!-- VIEW MODE F: FULL-TEXT SEARCH -->
        <Grid v-else-if="ws.viewMode.value === 'search'" variant="y" scrollable full-height>
          <Container gap="sm" padding="md">
            <Grid variant="x_between">
              <Body variant="xxsMono" color="muted">{{ ws.searchTotal.value }} full-text matches</Body>
              <Body v-if="ws.loadingSearch.value" variant="xxsMono" color="primary">Indexing...</Body>
            </Grid>
            <SearchResultCard
              v-for="{ entity, score, matches } in ws.searchResults.value"
              :key="entity.id"
              :entity="entity"
              :score="score"
              :matches="matches"
              :query="ws.searchQuery.value"
              :is-selected="ws.inspectedEntity.value?.id === entity.id"
              @click="ws.inspectEntityById(entity.id)"
              @match-click="fKey => ws.inspectEntityById(entity.id, fKey)"
            />
          </Container>
        </Grid>

        <!-- Bottom Status & Pagination Bar -->
        <Grid
          v-if="ws.viewMode.value === 'table' || ws.viewMode.value === 'cards' || ws.viewMode.value === 'text'"
          variant="x_between"
          padding="xs"
          surface="elevated"
          border="t"
        >
          <Grid variant="x" gap="sm">
            <Body variant="xxsMono" color="muted">
              Showing {{ ws.totalRows.value === 0 ? 0 : (ws.page.value - 1) * ws.pageSize.value + 1 }}–{{
                Math.min(ws.page.value * ws.pageSize.value, ws.totalRows.value)
              }}
              of {{ ws.totalRows.value.toLocaleString() }} records
            </Body>
            <Badge v-if="ws.activeAuthorFilter.value !== 'all'" label="Filtered by Owner" role="info" />
          </Grid>

          <Grid variant="x" gap="xs">
            <Button
              variant="tonal"
              size="xs"
              :disabled="ws.page.value <= 1 || ws.loadingData.value"
              @click="goToPage(ws.page.value - 1)"
            >
              ← Prev
            </Button>
            <Body variant="xsMono">Page {{ ws.page.value }} / {{ ws.totalPages.value }}</Body>
            <Button
              variant="tonal"
              size="xs"
              :disabled="ws.page.value >= ws.totalPages.value || ws.loadingData.value"
              @click="goToPage(ws.page.value + 1)"
            >
              Next →
            </Button>
          </Grid>
        </Grid>
        <div v-else />
      </Grid>

      <!-- RIGHT INSPECTOR & LINK PREVIEWER -->
      <EntitySidebar
        v-if="ws.rightToolOpen.value && (ws.inspectedEntity.value || ws.inspectedFile.value)"
        :entity="ws.inspectedEntity.value"
        :file-node="ws.inspectedFile.value"
        :subgraph="ws.inspectedSubgraph.value"
        :active-field-key="ws.activeFieldKey.value"
        :navigation-history="ws.navigationHistory.value"
        @close="ws.closeInspector()"
        @select-entity="handleEntitySelect"
        @navigate-id="id => ws.inspectEntityById(id)"
        @propose-mr-entity="ws.openProposeMrForEntity"
        @propose-mr-file="ws.openProposeMrForFile"
        @save-file="p => ws.saveFsItemContent(p.id, p.content_json)"
      />
    </Grid>

    <!-- 3. GIT MERGE REQUESTS MODAL -->
    <MergeRequestsModal
      :drawer-open="ws.mrDrawerOpen.value"
      :create-open="ws.createMrDialogOpen.value"
      :merge-requests="ws.mergeRequests.value"
      :current-user="ws.currentUser.value"
      :target-entity="ws.mrTargetEntity.value"
      :target-file="ws.mrTargetFile.value"
      :available-entities="availableEntitiesForMr"
      :loading="ws.loadingMr.value"
      @update:drawer-open="ws.mrDrawerOpen.value = $event"
      @update:create-open="ws.createMrDialogOpen.value = $event"
      @review-mr="ws.reviewMergeRequest"
      @create-mr="ws.submitMergeRequest"
      @inspect-target="id => ws.inspectEntityById(id)"
    />
  </Grid>
</template>