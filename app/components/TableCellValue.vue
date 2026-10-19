<script setup lang="ts">
import type { EntityField } from '~/types/graph';
import Grid from '~/components/ds/layout/Grid.vue';
import Body from '~/components/ds/typography/Body.vue';
import Badge from '~/components/ds/elements/Badge.vue';

defineProps<{
  field: EntityField;
}>();
</script>

<template>
  <Badge
    v-if="field.type === 'boolean'"
    :label="field.value ? 'true' : 'false'"
    :role="field.value ? 'success' : 'warning'"
  />

  <Body
    v-else-if="field.type === 'url' || field.type === 'email'"
    variant="xsMono"
    color="info"
    truncate
  >
    {{ field.value }}
  </Body>

  <Body
    v-else-if="field.type === 'number'"
    variant="xsMono"
    color="warning"
    truncate
  >
    {{ typeof field.value === 'number' && field.value > 9999 ? field.value.toLocaleString() : field.value }}
  </Body>

  <Body
    v-else-if="field.type === 'date'"
    variant="xsMono"
    color="secondary"
    truncate
  >
    {{ String(field.value).slice(0, 10) }}
  </Body>

  <Grid v-else-if="field.type === 'array'" variant="x_start" gap="xss">
    <Badge
      v-for="v in (field.value as string[]).slice(0, 2)"
      :key="v"
      :label="v"
      role="secondary"
    />
    <Body v-if="(field.value as string[]).length > 2" variant="xxsMono" color="muted">
      +{{ (field.value as string[]).length - 2 }}
    </Body>
  </Grid>

  <Body
    v-else-if="field.type === 'json'"
    variant="xsMono"
    color="success"
    truncate
  >
    {{ field.value }}
  </Body>

  <Body v-else variant="sRegular" color="default" truncate>
    {{ String(field.value) }}
  </Body>
</template>