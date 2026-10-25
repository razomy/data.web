<script setup lang="ts">
import type { TableRow } from '~/razomy/abstractions/graph';
import Card from '~/razomy/ui-vue/card/Card.vue';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';

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
