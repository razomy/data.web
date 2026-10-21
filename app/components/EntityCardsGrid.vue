<script setup lang="ts">
import { computed } from 'vue';
import type { TableRow } from '~/razomy/abstractions/graph';
import EntityCard from './EntityCard.vue';
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Alert from '~/razomy/ds-vue/alert/Alert.vue';

const props = defineProps<{
  rows: TableRow[];
  selectedEntityId?: string;
}>();

const emit = defineEmits<{
  (e: 'row-click', row: TableRow): void;
}>();

const visibleRows = computed(() => props.rows.slice(0, 200));
</script>

<template>
  <Grid variant="y" gap="md" padding="md" scrollable full-height>
    <Alert v-if="rows.length > 200" type="info">
      Showing 200 of {{ rows.length.toLocaleString() }} records — switch to Table view for virtualized scrolling.
    </Alert>

    <Grid variant="x_cards" gap="sm">
      <EntityCard
        v-for="row in visibleRows"
        :key="row.id"
        :row="row"
        :is-selected="selectedEntityId === row.entityId"
        @click="emit('row-click', row)"
      />
    </Grid>
  </Grid>
</template>
