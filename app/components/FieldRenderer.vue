<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EntityField } from '~/razomy/abstractions/graph';
import FieldValue from './FieldValue.vue';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';
import TextInput from '~/razomy/ui-vue/input/TextInput.vue';
import Button from '~/razomy/ui-vue/button/Button.vue';

const props = withDefaults(
  defineProps<{
    fields: EntityField[];
    compact?: boolean;
    editable?: boolean;
    activeFieldKey?: string;
  }>(),
  {
    compact: false,
    editable: false,
  }
);

const emit = defineEmits<{
  (e: 'update-field', payload: { key: string; value: string }): void;
}>();

const editingKey = ref<string | null>(null);
const editBuffer = ref<string>('');

const visibleFields = computed(() => {
  return props.compact ? props.fields.slice(0, 8) : props.fields;
});

function startEdit(field: EntityField) {
  if (!props.editable) return;
  editingKey.value = field.key;
  editBuffer.value = Array.isArray(field.value) ? field.value.join(', ') : String(field.value);
}

function saveEdit(field: EntityField) {
  emit('update-field', { key: field.key, value: editBuffer.value });
  editingKey.value = null;
}
</script>

<template>
  <Grid variant="y" border="all" rounded surface="default">
    <Grid
      v-for="field in visibleFields"
      :key="field.key"
      variant="x_auto_1fr_auto"
      gap="sm"
      padding="xs"
      border="b"
      :selected="activeFieldKey === field.key"
      :interactive="editable"
      @dblclick="startEdit(field)"
    >
      <Grid variant="y" class="ds-field-key">
        <Body variant="xsMono" color="muted" truncate>{{ field.key }}</Body>
      </Grid>

      <Grid variant="y">
        <Grid v-if="editingKey === field.key" variant="x_1fr_auto" gap="xs">
          <TextInput
            v-model="editBuffer"
            mono
            @enter="saveEdit(field)"
          />
          <Button size="xs" color="success" variant="flat" @click="saveEdit(field)">
            Save
          </Button>
        </Grid>
        <FieldValue v-else :field="field" />
      </Grid>

      <Grid variant="x" gap="xss">
        <Badge :label="field.type" role="neutral" variant="outlined" />
        <Button
          v-if="editable && editingKey !== field.key"
          size="xs"
          variant="text"
          icon="mdi-pencil-outline"
          title="Inline Edit Field"
          @click.stop="startEdit(field)"
        />
      </Grid>
    </Grid>

    <Grid v-if="compact && fields.length > 8" padding="xs" surface="panel">
      <Body variant="xxsMono" color="muted">+{{ fields.length - 8 }} more attributes</Body>
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-field-key {
  width: 125px;
}
</style>
