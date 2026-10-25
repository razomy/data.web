<script setup lang="ts">
import type { DataAuthor, DataViewMode } from '~/razomy/abstractions/graph';
import {Grid} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Button} from '@razomy/vue';
import {Badge} from '@razomy/vue';

defineProps<{
  authors: DataAuthor[];
  currentUser: DataAuthor;
  viewMode: DataViewMode;
  openMrCount: number;
  pendingMyApprovalCount: number;
  activeDatasetName?: string;
  totalRecords?: number;
}>();

const emit = defineEmits<{
  (e: 'update:viewMode', mode: DataViewMode): void;
  (e: 'switch-user', userId: string): void;
  (e: 'open-mr-drawer'): void;
  (e: 'open-create-mr'): void;
}>();

const VIEW_MODES: { id: DataViewMode; label: string; icon: string }[] = [
  { id: 'table', label: 'Table', icon: 'mdi-table' },
  { id: 'cards', label: 'Cards', icon: 'mdi-view-grid-outline' },
  { id: 'files', label: 'Files', icon: 'mdi-folder-outline' },
  { id: 'graph', label: 'Graph', icon: 'mdi-graph-outline' },
  { id: 'text', label: 'Docs & Links', icon: 'mdi-file-document-outline' },
  { id: 'search', label: 'Search', icon: 'mdi-magnify' },
];
</script>

<template>
  <Grid
    variant="x_auto_1fr_auto"
    padding="xs"
    gap="sm"
    surface="elevated"
    border="b"
  >
    <!-- Left: Git Branch & Active Dataset Context -->
    <Grid variant="x" gap="xs">
      <Grid variant="x" gap="xss" padding="xs" surface="default" border="all" rounded>
        <v-icon icon="mdi-source-branch" size="14" color="primary" />
        <Body variant="xxsMono" color="muted">branch:</Body>
        <Body variant="xsMono" color="primary">main</Body>
      </Grid>

      <Grid variant="x" gap="xs">
        <v-icon icon="mdi-database" size="16" color="secondary" />
        <Body variant="sBold" truncate>{{ activeDatasetName || 'All Database Records' }}</Body>
        <Badge v-if="totalRecords !== undefined" :label="`${totalRecords.toLocaleString()} rows`" role="secondary" />
      </Grid>
    </Grid>

    <!-- Center: Multi-Modal View Switcher -->
    <Grid variant="x_start" gap="xss">
      <Button
        v-for="m in VIEW_MODES"
        :key="m.id"
        size="xs"
        :variant="viewMode === m.id ? 'flat' : 'text'"
        :color="viewMode === m.id ? 'primary' : 'default'"
        :prepend-icon="m.icon"
        @click="emit('update:viewMode', m.id)"
      >
        {{ m.label }}
      </Button>
    </Grid>

    <!-- Right: Git Merge Requests & Author Switcher -->
    <Grid variant="x" gap="xs">
      <Button
        color="secondary"
        variant="tonal"
        size="xs"
        prepend-icon="mdi-source-pull"
        @click="emit('open-create-mr')"
      >
        + Propose MR
      </Button>

      <Button
        color="primary"
        variant="outlined"
        size="xs"
        prepend-icon="mdi-source-merge"
        @click="emit('open-mr-drawer')"
      >
        MRs ({{ openMrCount }})
        <template v-if="pendingMyApprovalCount > 0">
          · {{ pendingMyApprovalCount }} review
        </template>
      </Button>

      <!-- Active Author Selector -->
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <Button
            v-bind="menuProps"
            variant="tonal"
            color="default"
            size="xs"
            prepend-icon="mdi-account-circle-outline"
            append-icon="mdi-chevron-down"
          >
            {{ currentUser.name }} ({{ currentUser.handle }})
          </Button>
        </template>

        <v-list density="compact">
          <v-list-subheader>Switch Active Git Data Author</v-list-subheader>
          <v-list-item
            v-for="author in authors"
            :key="author.id"
            :active="author.id === currentUser.id"
            :title="author.name"
            :subtitle="`${author.handle} · ${author.role}`"
            prepend-icon="mdi-account-outline"
            @click="emit('switch-user', author.id)"
          />
        </v-list>
      </v-menu>
    </Grid>
  </Grid>
</template>
