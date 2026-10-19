<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DataAuthor, DatasetCollection, FsNodeRecord } from '~/types/graph';
import { FsNodeType } from '~/types/graph';
import Grid from '~/components/ds/layout/Grid.vue';
import Body from '~/components/ds/typography/Body.vue';
import Badge from '~/components/ds/elements/Badge.vue';
import TextInput from '~/components/ds/input/TextInput.vue';
import Button from '~/components/ds/button/Button.vue';

const props = defineProps<{
  datasets: DatasetCollection[];
  authors: DataAuthor[];
  activeDatasetId: string;
  activeTypeFilter: string;
  activeAuthorFilter: string;
  typeCounts: Record<string, number>;
  fsFolders: FsNodeRecord[];
  currentFolderId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select-dataset', dataset: DatasetCollection): void;
  (e: 'select-type', type: string): void;
  (e: 'select-author', authorId: string): void;
  (e: 'select-folder', folderId: string | null): void;
}>();

const sidebarSearch = ref('');

const filteredDatasets = computed(() => {
  if (!sidebarSearch.value.trim()) return props.datasets;
  const q = sidebarSearch.value.toLowerCase();
  return props.datasets.filter(
    d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.entityTypeFilter.toLowerCase().includes(q)
  );
});

const relationalDatasets = computed(() =>
  filteredDatasets.value.filter(d => d.category === 'Relational')
);

const multimodalDatasets = computed(() =>
  filteredDatasets.value.filter(d => d.category !== 'Relational')
);

const directoriesOnly = computed(() =>
  props.fsFolders.filter(f => f.type === FsNodeType.Directory)
);
</script>

<template>
  <Grid
    as="aside"
    variant="y_header_main_footer"
    surface="default"
    border="r"
    full-height
    class="ds-left-navigator"
  >
    <!-- Sidebar Header -->
    <Grid variant="y" gap="xs" padding="sm" surface="elevated" border="b">
      <Grid variant="x_between">
        <Grid variant="x" gap="xs">
          <v-icon icon="mdi-database-search-outline" size="16" color="primary" />
          <Body variant="xsBold" uppercase>Database Navigator</Body>
        </Grid>
        <Badge :label="`${datasets.length} schemas`" role="primary" />
      </Grid>

      <TextInput
        v-model="sidebarSearch"
        placeholder="Filter tables & views..."
        icon="mdi-filter-variant"
        clearable
        @clear="sidebarSearch = ''"
      />
    </Grid>

    <!-- Scrollable Navigation Tree -->
    <Grid variant="y" gap="md" padding="sm" scrollable full-height>
      <!-- Section 1: Relational Tables -->
      <Grid variant="y" gap="xss">
        <Grid variant="x_between" padding="xs">
          <Body variant="xxsMono" color="muted" uppercase>Relational Tables</Body>
          <Body variant="xxsMono" color="light">SQL / ORM</Body>
        </Grid>

        <Grid
          v-for="ds in relationalDatasets"
          :key="ds.id"
          variant="x_auto_1fr_auto"
          gap="xs"
          padding="xs"
          rounded
          border="all"
          interactive
          :selected="activeDatasetId === ds.id"
          @click="emit('select-dataset', ds)"
        >
          <v-icon :icon="ds.icon || 'mdi-table'" size="16" color="primary" />
          <Grid variant="y">
            <Body variant="sMedium" truncate>{{ ds.name }}</Body>
            <Body variant="xxsMono" color="muted" truncate>Owner: {{ ds.owner.handle }}</Body>
          </Grid>
          <Badge :label="ds.count" role="neutral" />
        </Grid>
      </Grid>

      <!-- Section 2: Multi-Modal Representations -->
      <Grid variant="y" gap="xss">
        <Grid variant="x_between" padding="xs">
          <Body variant="xxsMono" color="muted" uppercase>Multi-Modal Views</Body>
          <Body variant="xxsMono" color="light">Graph · FS · Docs</Body>
        </Grid>

        <Grid
          v-for="ds in multimodalDatasets"
          :key="ds.id"
          variant="x_auto_1fr_auto"
          gap="xs"
          padding="xs"
          rounded
          border="all"
          interactive
          :selected="activeDatasetId === ds.id"
          @click="emit('select-dataset', ds)"
        >
          <v-icon :icon="ds.icon" size="16" color="secondary" />
          <Grid variant="y">
            <Body variant="sMedium" truncate>{{ ds.name }}</Body>
            <Body variant="xxsMono" color="muted" truncate>{{ ds.category }} · {{ ds.owner.handle }}</Body>
          </Grid>
          <Badge :label="ds.count" role="secondary" />
        </Grid>
      </Grid>

      <!-- Section 3: File Partitions -->
      <Grid variant="y" gap="xss">
        <Grid variant="x_between" padding="xs">
          <Body variant="xxsMono" color="muted" uppercase>Storage Partitions</Body>
          <Button
            v-if="currentFolderId"
            size="xs"
            variant="text"
            color="primary"
            @click="emit('select-folder', null)"
          >
            /root
          </Button>
        </Grid>

        <Grid
          variant="x_auto_1fr"
          gap="xs"
          padding="xs"
          rounded
          interactive
          :selected="currentFolderId === null && activeDatasetId === 'ds-fs-root'"
          @click="emit('select-folder', null)"
        >
          <v-icon icon="mdi-folder-home-outline" size="16" color="warning" />
          <Body variant="xsMono">/ (root partition)</Body>
        </Grid>

        <Grid
          v-for="dir in directoriesOnly"
          :key="dir.id"
          variant="x_auto_1fr"
          gap="xs"
          padding="xs"
          rounded
          interactive
          :selected="currentFolderId === dir.id"
          @click="emit('select-folder', dir.id)"
        >
          <v-icon icon="mdi-folder-outline" size="16" color="warning" />
          <Body variant="xsMono" truncate>/{{ dir.name }}</Body>
        </Grid>
      </Grid>

      <!-- Section 4: Filter by Data Owner / Author -->
      <Grid variant="y" gap="xss">
        <Grid variant="x_between" padding="xs">
          <Body variant="xxsMono" color="muted" uppercase>Data Owners (Git)</Body>
          <Button
            v-if="activeAuthorFilter !== 'all'"
            size="xs"
            variant="text"
            color="primary"
            @click="emit('select-author', 'all')"
          >
            Clear
          </Button>
        </Grid>

        <Grid
          v-for="author in authors"
          :key="author.id"
          variant="x_auto_1fr"
          gap="xs"
          padding="xs"
          rounded
          border="all"
          interactive
          :selected="activeAuthorFilter === author.id"
          @click="emit('select-author', activeAuthorFilter === author.id ? 'all' : author.id)"
        >
          <v-icon icon="mdi-account-badge-outline" size="16" color="info" />
          <Grid variant="y">
            <Body variant="sMedium" truncate>{{ author.name }}</Body>
            <Body variant="xxsMono" color="muted" truncate>{{ author.handle }} · {{ author.role }}</Body>
          </Grid>
        </Grid>
      </Grid>
    </Grid>

    <!-- Sidebar Footer -->
    <Grid variant="x_between" padding="xs" surface="elevated" border="t">
      <Body variant="xxsMono" color="muted">JetBrains Data Navigator</Body>
      <Badge label="HEAD -> main" role="success" />
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-left-navigator {
  width: 270px;
}
</style>