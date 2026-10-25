<script setup lang="ts">
import type { Entity, EntityField } from '~/razomy/abstractions/graph';
import {Card} from '@razomy/vue';
import {Grid} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Badge} from '@razomy/vue';

defineProps<{
  entity: Entity;
  score: number;
  matches: { field: EntityField; snippet: string }[];
  query: string;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
  (e: 'match-click', fieldKey: string): void;
}>();

function getSnippet(val: string): string {
  return val.length > 70 ? val.slice(0, 70) + '…' : val;
}
</script>

<template>
  <Card
    padding="md"
    gap="sm"
    interactive
    :selected="isSelected"
    @click="$emit('click')"
  >
    <Grid variant="x_auto_1fr" gap="md" align="start">
      <v-avatar size="48" rounded="lg" color="primary" variant="tonal">
        <v-img v-if="entity.imageUrl" :src="entity.imageUrl" :alt="entity.label" cover />
        <Body v-else variant="lgBold" color="primary">{{ entity.label.charAt(0) }}</Body>
      </v-avatar>

      <Grid variant="y" gap="xs">
        <Grid variant="x_between">
          <Grid variant="x" gap="xs">
            <Badge :label="entity.type" :entity-type="entity.type" dot />
            <Body variant="xsMono" color="muted">{{ entity.id }}</Body>
            <Badge v-if="query" :label="`score ${score}`" role="primary" />
          </Grid>
          <Badge v-if="isSelected" label="INSPECTING" role="primary" variant="flat" />
        </Grid>

        <Body variant="mBold" truncate>{{ entity.label }}</Body>
        <Body variant="sRegular" color="muted">{{ entity.description }}</Body>

        <Grid variant="x_start" gap="sm">
          <Body variant="xxsMono" color="muted">{{ entity.fields.length }} fields</Body>
          <Body variant="xxsMono" color="secondary">{{ entity.connectedTo.length }} links</Body>
          <Body variant="xxsMono" color="muted">Owner: {{ entity.author?.handle }}</Body>
        </Grid>
      </Grid>
    </Grid>

    <!-- Match Snippets -->
    <Grid
      v-if="matches.length > 0"
      variant="x_two"
      gap="xs"
      padding="xs"
      surface="panel"
      border="t"
      @click.stop
    >
      <Grid
        v-for="{ field, snippet } in matches"
        :key="field.key"
        variant="x_auto_1fr"
        gap="xs"
        padding="xs"
        surface="default"
        border="all"
        rounded
        interactive
        @click="$emit('match-click', field.key)"
      >
        <v-icon icon="mdi-magnify-scan" size="14" color="primary" />
        <Grid variant="y">
          <Body variant="xxsMono" color="muted">{{ field.key }}</Body>
          <Body variant="xsRegular" truncate>{{ getSnippet(snippet) }}</Body>
        </Grid>
      </Grid>
    </Grid>
  </Card>
</template>
