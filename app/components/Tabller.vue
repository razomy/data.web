<script setup lang="ts">
import {computed, ref} from 'vue';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import TableExplorer from '~/components/tableExplorer.vue';
import {Tables} from "~/composables/tables.ts";

const selectedItem = defineModel<string>('selectedItem');


// Выбираем текущую активную таблицу (например, через селект в UI)
const currentSchema = computed(() => Tables[selectedItem.value + 'Declaration']);

const search = ref('');
const page = ref(1);
const sortBy = ref('');
const sortDir = ref<'asc' | 'desc'>('asc');

const records = ref([]);
watch(selectedItem, async (newId) => {
  try {
    const res =  (await $fetch<{ nodes: any[] }>('/api/table', {
      query: {name:selectedItem.value},
    })).nodes;
    console.log(res);
    records.value = res as any;
  } catch (error) {
    console.error("Failed to fetch user data:", error)
  } finally {
  }
}, { immediate: true }) // immediate: true runs it initially on component
</script>


<template>
  <Grid variant="y_header_main" full-height clip surface="background">
    <!--      :variant="ws.rightToolOpen.value && (ws.inspectedFile.value || ws.inspectedEntity.value) ? 'x_1fr_auto' : 'full'"-->
    <Grid
      full-height
      clip
    >

      <select v-model="selectedItem">
        <option v-for="(decl, key) in Tables" :key="key" :value="key">
          {{ decl.title }} ({{ decl.name_ }})
        </option>
      </select>

      <TableExplorer
        :schema="currentSchema!"
        :records="records"
        :total="records.length"
        :page="page"
        :page-size="25"
        :total-pages="1"
        v-model:search="search"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        allow-mr
        @toggle-sort="(field) => { sortBy = field; sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }"
        @inspect="(item) => console.log('Inspect:', item)"
        @propose-mr="(item) => console.log('Propose MR:', item)"
      />

      <!--      <EntitySidebar-->
      <!--        v-if="ws.rightToolOpen.value && (ws.inspectedFile.value || ws.inspectedEntity.value)"-->
      <!--        :entity="ws.inspectedEntity.value"-->
      <!--        :file-node="ws.inspectedFile.value"-->
      <!--        :subgraph="ws.inspectedSubgraph.value"-->
      <!--        :navigation-history="ws.navigationHistory.value"-->
      <!--        @close="ws.closeInspector()"-->
      <!--        @select-entity="e => ws.inspectEntityById(e.id)"-->
      <!--        @navigate-id="id => ws.inspectEntityById(id)"-->
      <!--        @propose-mr-entity="ws.openProposeMrForEntity"-->
      <!--        @propose-mr-file="ws.openProposeMrForFile"-->
      <!--        @save-file="async p => { await ws.saveFsItemContent(p.id, p.content_json); await loadPage(); }"-->
      <!--      />-->
    </Grid>

    <!--    <MergeRequestsModal-->
    <!--      :drawer-open="ws.mrDrawerOpen.value"-->
    <!--      :create-open="ws.createMrDialogOpen.value"-->
    <!--      :merge-requests="ws.mergeRequests.value"-->
    <!--      :current-user="ws.currentUser.value"-->
    <!--      :target-entity="ws.mrTargetEntity.value"-->
    <!--      :target-file="ws.mrTargetFile.value"-->
    <!--      :available-entities="ws.globalNodes.value.map(n => n.entity)"-->
    <!--      :loading="ws.loadingMr.value"-->
    <!--      @update:drawer-open="ws.mrDrawerOpen.value = $event"-->
    <!--      @update:create-open="ws.createMrDialogOpen.value = $event"-->
    <!--      @review-mr="async p => { await ws.reviewMergeRequest(p); await loadPage(); }"-->
    <!--      @create-mr="ws.submitMergeRequest"-->
    <!--      @inspect-target="id => ws.inspectEntityById(id)"-->
    <!--    />-->
  </Grid>
</template>
