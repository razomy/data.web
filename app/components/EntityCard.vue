<script setup lang="ts">
import type { TableRow } from '~/razomy/abstractions/graph';
import {Card} from '@razomy/vue';
import {Grid} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Badge} from '@razomy/vue';

defineProps<{
  row: TableRow;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <Card
    padding="sm"
    gap="xs"
    interactive
    :selected="isSelected"
    @click="$emit('click')"
  >
    <v-img
      v-if="row.imageUrl"
      :src="row.imageUrl"
      :alt="row.label"
      height="88"
      cover
      rounded
    />

    <Grid variant="x_between">
      <Badge :label="row.type" :entity-type="row.type" dot />
      <Badge v-if="isSelected" label="INSPECTING" role="primary" variant="flat" />
    </Grid>

    <Body variant="mBold" truncate>{{ row.label }}</Body>

    <Grid variant="x_between" border="t" padding="xs">
      <Body variant="xxsMono" color="muted">{{ row.fieldCount }} attrs</Body>
      <Body variant="xxsMono" color="primary">{{ row.connectedCount }} links</Body>
    </Grid>
  </Card>
</template>
