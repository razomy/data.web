<script setup lang="ts">
import { computed } from 'vue';
import type { TableRow } from '~/razomy/abstractions/graph';
import { entities } from '~/data/mockData';
import {Grid} from '@razomy/vue';
import {Card} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Badge} from '@razomy/vue';
import {Button} from '@razomy/vue';
import {AppCopyBtn} from '@razomy/vue';

const props = defineProps<{
  rows: TableRow[];
  selectedEntityId?: string;
}>();

const emit = defineEmits<{
  (e: 'row-click', row: TableRow): void;
  (e: 'preview-entity', entityId: string): void;
}>();

const visibleDocs = computed(() => props.rows.slice(0, 50));

function getLinkedReferences(row: TableRow) {
  const seed = row.index;
  return [
    entities[seed % entities.length]!,
    entities[(seed + 2) % entities.length]!,
  ];
}
</script>

<template>
  <Grid variant="y" gap="md" padding="md" scrollable full-height>
    <Card
      v-for="row in visibleDocs"
      :key="row.id"
      padding="md"
      gap="sm"
      interactive
      :selected="selectedEntityId === row.entityId"
      @click="emit('row-click', row)"
    >
      <Grid variant="x_between">
        <Grid variant="x" gap="xs">
          <Badge :label="row.type" :entity-type="row.type" dot />
          <Body variant="xsMono" color="muted">{{ row.entityId }}</Body>
          <Badge
            v-if="row.author"
            :label="`Owner: ${row.author.handle}`"
            role="info"
          />
        </Grid>

        <Grid variant="x" gap="xs" @click.stop>
          <Body variant="xxsMono" color="muted">Updated {{ row.updatedAt }}</Body>
          <AppCopyBtn
            :text="row.fields.map(f => `${f.key}: ${f.value}`).join('\n')"
            label="Copy Doc"
          />
        </Grid>
      </Grid>

      <Body variant="lgBold">{{ row.label }}</Body>

      <Body variant="sRegular" color="muted">
        Entity <Body variant="sSemiBold" color="default">{{ row.label }}</Body> ({{ row.type }}) is versioned by
        <Body variant="sSemiBold" color="primary">{{ row.author?.name || 'Sarah Chen' }}</Body> with
        {{ row.connectedCount }} cross-table graph links.
      </Body>

      <!-- Cross-References & Quick Preview Bar -->
      <Grid variant="x_start" gap="xs" padding="xs" surface="panel" border="all" rounded @click.stop>
        <Body variant="xxsMono" color="muted" uppercase>Cross-References:</Body>
        <Button
          v-for="refEnt in getLinkedReferences(row)"
          :key="refEnt.id"
          size="xs"
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-link-variant"
          @click="emit('preview-entity', refEnt.id)"
        >
          {{ refEnt.label }} ({{ refEnt.id }})
        </Button>
      </Grid>

      <!-- Structured Attributes Summary Grid -->
      <Grid variant="x_three" gap="xs" padding="xs" surface="elevated" border="all" rounded>
        <Grid
          v-for="field in row.fields.slice(0, 6)"
          :key="field.key"
          variant="x_auto_1fr"
          gap="xss"
        >
          <Body variant="xxsMono" color="muted">{{ field.key }}:</Body>
          <Body variant="xxsMono" color="default" truncate>
            {{ Array.isArray(field.value) ? field.value.join(', ') : field.value }}
          </Body>
        </Grid>
      </Grid>
    </Card>
  </Grid>
</template>
