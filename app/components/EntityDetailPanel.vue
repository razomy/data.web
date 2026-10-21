<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Entity } from '~/razomy/abstractions/graph';
import FieldRenderer from './FieldRenderer.vue';
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Body from '~/razomy/ds-vue/typography/Body.vue';
import Badge from '~/razomy/ds-vue/elements/Badge.vue';
import Button from '~/razomy/ds-vue/button/Button.vue';
import AppCopyBtn from './ui/AppCopyBtn.vue';
import StatCard from './ui/StatCard.vue';
import { entities } from '~/data/mockData';

const props = defineProps<{
  entity: Entity;
  modelValue?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'close'): void;
  (e: 'navigate', id: string): void;
}>();

const tab = ref('overview');

const connectedEntities = computed(() => {
  return entities.filter(e => props.entity.connectedTo.includes(e.id));
});
</script>

<template>
  <v-dialog
    :model-value="modelValue !== undefined ? modelValue : true"
    max-width="680"
    scrollable
    @update:model-value="val => { if (!val) emit('close'); emit('update:modelValue', val); }"
  >
    <v-card>
      <Grid variant="x_auto_1fr_auto" gap="sm" padding="md" surface="elevated" border="b">
        <v-avatar size="44" rounded="lg" color="primary" variant="tonal">
          <Body variant="lgBold" color="primary">{{ entity.label.charAt(0) }}</Body>
        </v-avatar>

        <Grid variant="y" gap="xss">
          <Grid variant="x" gap="xs">
            <Badge :label="entity.type" :entity-type="entity.type" dot />
            <Body variant="xxsMono" color="muted">{{ entity.id }}</Body>
          </Grid>
          <Body variant="lgBold" truncate>{{ entity.label }}</Body>
        </Grid>

        <Button icon="mdi-close" variant="text" size="xs" @click="emit('close')" />
      </Grid>

      <v-tabs v-model="tab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="fields">Attributes ({{ entity.fields.length }})</v-tab>
        <v-tab value="connections">Links ({{ connectedEntities.length }})</v-tab>
        <v-tab value="json">JSON</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="overview">
            <Grid variant="y" gap="md" padding="xs">
              <Body variant="sRegular" color="muted">{{ entity.description }}</Body>
              <Grid variant="x_two" gap="sm">
                <StatCard label="Fields" :value="entity.fields.length" color="primary" icon="mdi-database" />
                <StatCard label="Connected" :value="entity.connectedTo.length" color="secondary" icon="mdi-graph" />
              </Grid>
              <FieldRenderer :fields="entity.fields" compact />
            </Grid>
          </v-window-item>

          <v-window-item value="fields">
            <FieldRenderer :fields="entity.fields" />
          </v-window-item>

          <v-window-item value="connections">
            <Grid variant="y" gap="xs">
              <Grid
                v-for="ce in connectedEntities"
                :key="ce.id"
                variant="x_auto_1fr_auto"
                gap="sm"
                padding="sm"
                surface="panel"
                border="all"
                rounded
                interactive
                @click="emit('navigate', ce.id)"
              >
                <Badge :label="ce.type" :entity-type="ce.type" />
                <Body variant="sSemiBold">{{ ce.label }}</Body>
                <v-icon icon="mdi-chevron-right" size="18" />
              </Grid>
            </Grid>
          </v-window-item>

          <v-window-item value="json">
            <Grid variant="y" gap="xs">
              <Grid variant="x_end">
                <AppCopyBtn :text="JSON.stringify(entity, null, 2)" label="Copy JSON" />
              </Grid>
              <Body as="pre" variant="xsMono" color="success">{{ JSON.stringify(entity, null, 2) }}</Body>
            </Grid>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
