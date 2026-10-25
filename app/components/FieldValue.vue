<script setup lang="ts">
import { computed } from 'vue';
import type { EntityField } from '~/razomy/abstractions/graph';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';

const props = defineProps<{
  field: EntityField;
}>();

const parsedJson = computed(() => {
  if (props.field.type !== 'json') return {};
  try {
    return JSON.parse(props.field.value as string);
  } catch {
    return { raw: props.field.value };
  }
});

const formattedNumber = computed(() => {
  const val = props.field.value;
  return typeof val === 'number' && val > 999999 ? val.toLocaleString() : val;
});
</script>

<template>
  <Badge
    v-if="field.type === 'boolean'"
    :label="field.value ? 'true' : 'false'"
    :role="field.value ? 'success' : 'warning'"
  />

  <Grid v-else-if="field.type === 'url'" variant="x_start" gap="xss">
    <a
      :href="field.value as string"
      target="_blank"
      rel="noopener noreferrer"
      @click.stop
    >
      <Body variant="xsMono" color="info">{{ field.value }}</Body>
    </a>
    <v-icon icon="mdi-open-in-new" size="12" color="info" />
  </Grid>

  <Body v-else-if="field.type === 'email'" variant="xsMono" color="info">
    {{ field.value }}
  </Body>

  <Grid v-else-if="field.type === 'array'" variant="x_start" gap="xss">
    <Badge
      v-for="v in (field.value as string[])"
      :key="v"
      :label="v"
      role="secondary"
    />
  </Grid>

  <Grid v-else-if="field.type === 'json'" variant="y" padding="xs" surface="panel" border="all" rounded>
    <Body as="pre" variant="xxsMono" color="success">{{ JSON.stringify(parsedJson, null, 2) }}</Body>
  </Grid>

  <Body v-else-if="field.type === 'number'" variant="xsMono" color="warning">
    {{ formattedNumber }}
  </Body>

  <Body v-else-if="field.type === 'date'" variant="xsMono" color="secondary">
    {{ field.value }}
  </Body>

  <Grid v-else-if="field.type === 'geo'" variant="x_start" gap="xss">
    <v-icon icon="mdi-map-marker-outline" size="13" color="primary" />
    <Body variant="xsMono" color="default">{{ field.value }}</Body>
  </Grid>

  <Body v-else variant="sRegular" color="default">
    {{ field.value }}
  </Body>
</template>
