<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '~/composables/useWorkspaceStore';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import GitTopBar from '~/components/GitTopBar.vue';
import GlobalGraphCanvas from '~/components/GlobalGraphCanvas.vue';
import EntitySidebar from '~/components/EntitySidebar.vue';
import MergeRequestsModal from '~/components/MergeRequestsModal.vue';

const ws = useWorkspaceStore();
const router = useRouter();

onMounted(async () => {
  await ws.initWorkspace();
});
</script>

<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <GitTopBar
      :authors="ws.authors.value"
      :current-user="ws.currentUser.value"
      :view-mode="'graph'"
      :open-mr-count="ws.openMergeRequests.value.length"
      :pending-my-approval-count="ws.pendingMyApprovalCount.value"
      active-dataset-name="Global Knowledge Graph"
      :total-records="ws.globalNodes.value.length"
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
      <GlobalGraphCanvas
        :nodes="ws.globalNodes.value"
        :edges="ws.globalEdges.value"
        :selected-entity-id="ws.inspectedEntity.value?.id"
        :loading="ws.loadingGraph.value"
        @select-entity="e => ws.inspectEntityById(e.id)"
        @reset="ws.loadGlobalGraph()"
      />

      <EntitySidebar
        v-if="ws.rightToolOpen.value && ws.inspectedEntity.value"
        :entity="ws.inspectedEntity.value"
        :subgraph="ws.inspectedSubgraph.value"
        :navigation-history="ws.navigationHistory.value"
        @close="ws.closeInspector()"
        @select-entity="e => ws.inspectEntityById(e.id)"
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
      @review-mr="ws.reviewMergeRequest"
      @create-mr="ws.submitMergeRequest"
      @inspect-target="id => ws.inspectEntityById(id)"
    />
  </Grid>
</template>
