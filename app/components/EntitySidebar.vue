<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Entity, FsNodeRecord, LocalSubgraph, MergeRequestFieldChange } from '~/types/graph';
import FieldRenderer from './FieldRenderer.vue';
import EntityGraphView from './EntityGraphView.vue';
import Grid from '~/components/ds/layout/Grid.vue';
import Card from '~/components/ds/card/Card.vue';
import Body from '~/components/ds/typography/Body.vue';
import Button from '~/components/ds/button/Button.vue';
import Badge from '~/components/ds/elements/Badge.vue';
import TextInput from '~/components/ds/input/TextInput.vue';
import AppCopyBtn from './ui/AppCopyBtn.vue';
import StatCard from './ui/StatCard.vue';
import { resolveLocalSubgraph } from '~/data/graphResolver';

type InspectorMode = 'split' | 'table' | 'graph' | 'links' | 'json';

const props = defineProps<{
  entity?: Entity | null;
  fileNode?: FsNodeRecord | null;
  subgraph?: LocalSubgraph | null;
  activeFieldKey?: string;
  navigationHistory?: { id: string; label: string; type: string }[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-entity', entity: Entity): void;
  (e: 'navigate-id', id: string): void;
  (e: 'propose-mr-entity', entity: Entity): void;
  (e: 'propose-mr-file', file: FsNodeRecord): void;
  (e: 'save-file', payload: { id: string; content_json: string }): void;
  (e: 'quick-mr-change', payload: { entity: Entity; change: MergeRequestFieldChange }): void;
}>();

const viewMode = ref<InspectorMode>('split');
const fieldSearch = ref('');
const previewTarget = ref<Entity | null>(null);
const editedFieldsCount = ref(0);

const localGraph = computed(() => {
  if (!props.entity) return null;
  return props.subgraph || resolveLocalSubgraph(props.entity);
});

const filteredFields = computed(() => {
  if (!props.entity) return [];
  if (!fieldSearch.value.trim()) return props.entity.fields;
  const q = fieldSearch.value.toLowerCase();
  return props.entity.fields.filter(
    f =>
      f.key.toLowerCase().includes(q) ||
      String(f.value).toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
  );
});

function handleInlineFieldUpdate(payload: { key: string; value: string }) {
  if (!props.entity) return;
  const field = props.entity.fields.find(f => f.key === payload.key);
  if (!field) return;
  field.value = payload.value;
  editedFieldsCount.value++;
}
</script>

<template>
  <Grid
    as="aside"
    variant="y_header_main_footer"
    surface="default"
    border="l"
    full-height
    class="ds-right-inspector"
  >
    <!-- CASE 1: ENTITY INSPECTOR -->
    <template v-if="entity">
      <!-- Top Header -->
      <Grid variant="y" gap="sm" padding="sm" surface="elevated" border="b">
        <!-- Breadcrumb History Trail -->
        <Grid v-if="navigationHistory && navigationHistory.length > 1" variant="x_start" gap="xss">
          <v-icon icon="mdi-history" size="13" color="primary" />
          <Badge
            v-for="item in navigationHistory.slice(0, 4)"
            :key="item.id"
            :label="item.label"
            :role="item.id === entity.id ? 'primary' : 'neutral'"
            clickable
            @click="emit('navigate-id', item.id)"
          />
        </Grid>

        <Grid variant="x_between">
          <Grid variant="x" gap="xs">
            <Badge :label="entity.type" :entity-type="entity.type" dot />
            <AppCopyBtn :text="entity.id" :label="entity.id" />
          </Grid>

          <Grid variant="x" gap="xs">
            <Button
              color="secondary"
              variant="flat"
              size="xs"
              prepend-icon="mdi-source-pull"
              @click="emit('propose-mr-entity', entity)"
            >
              Propose MR {{ editedFieldsCount > 0 ? `(${editedFieldsCount})` : '' }}
            </Button>
            <Button
              icon="mdi-close"
              variant="text"
              size="xs"
              color="default"
              title="Close Inspector"
              @click="emit('close')"
            />
          </Grid>
        </Grid>

        <!-- Entity Banner -->
        <Grid variant="x_auto_1fr" gap="sm">
          <v-avatar size="44" rounded="lg" color="primary" variant="tonal">
            <v-img v-if="entity.imageUrl" :src="entity.imageUrl" :alt="entity.label" cover />
            <Body v-else variant="lgBold" color="primary">{{ entity.label.charAt(0) }}</Body>
          </v-avatar>

          <Grid variant="y" gap="xss">
            <Body variant="lgBold" truncate>{{ entity.label }}</Body>
            <Grid variant="x_start" gap="xs">
              <Body variant="xxsMono" color="muted">{{ entity.fields.length }} attributes</Body>
              <Body variant="xxsMono" color="primary">
                {{ localGraph?.neighborNodes.length || 0 }} linked references
              </Body>
            </Grid>
          </Grid>
        </Grid>

        <!-- Git Owner Badge -->
        <Grid
          v-if="entity.author"
          variant="x_between"
          padding="xs"
          surface="panel"
          border="all"
          rounded
        >
          <Grid variant="x" gap="xs">
            <v-icon icon="mdi-shield-account-outline" size="15" color="primary" />
            <Body variant="xxsMono" color="muted">Data Owner:</Body>
            <Body variant="xsSemiBold">{{ entity.author.name }}</Body>
            <Body variant="xxsMono" color="primary">({{ entity.author.handle }})</Body>
          </Grid>
          <Badge :label="entity.author.role" role="info" />
        </Grid>

        <!-- Representation Mode Tabs -->
        <Grid variant="x_start" gap="xss">
          <Button
            size="xs"
            :variant="viewMode === 'split' ? 'flat' : 'tonal'"
            :color="viewMode === 'split' ? 'primary' : 'default'"
            prepend-icon="mdi-view-split-vertical"
            @click="viewMode = 'split'"
          >
            Split
          </Button>
          <Button
            size="xs"
            :variant="viewMode === 'table' ? 'flat' : 'tonal'"
            :color="viewMode === 'table' ? 'primary' : 'default'"
            prepend-icon="mdi-pencil-box-outline"
            @click="viewMode = 'table'"
          >
            Edit Attrs
          </Button>
          <Button
            size="xs"
            :variant="viewMode === 'links' ? 'flat' : 'tonal'"
            :color="viewMode === 'links' ? 'primary' : 'default'"
            prepend-icon="mdi-link-variant"
            @click="viewMode = 'links'"
          >
            Links & Preview
          </Button>
          <Button
            size="xs"
            :variant="viewMode === 'graph' ? 'flat' : 'tonal'"
            :color="viewMode === 'graph' ? 'primary' : 'default'"
            prepend-icon="mdi-graph-outline"
            @click="viewMode = 'graph'"
          >
            Graph
          </Button>
          <Button
            size="xs"
            :variant="viewMode === 'json' ? 'flat' : 'tonal'"
            :color="viewMode === 'json' ? 'primary' : 'default'"
            prepend-icon="mdi-code-json"
            @click="viewMode = 'json'"
          >
            JSON
          </Button>
        </Grid>
      </Grid>

      <!-- Main Body -->
      <Grid variant="y" scrollable full-height>
        <!-- 1. SPLIT VIEW -->
        <Grid v-if="viewMode === 'split'" variant="y" gap="md" padding="sm">
          <EntityGraphView
            :entity="entity"
            :subgraph-data="localGraph"
            :height="220"
            @select-entity="ent => emit('select-entity', ent)"
            @toggle-expand="viewMode = 'graph'"
          />

          <Card padding="sm" gap="xs">
            <Body variant="xxsMono" color="primary" uppercase>Context Summary</Body>
            <Body variant="sRegular" color="muted">{{ entity.description }}</Body>
          </Card>

          <!-- Linked Nodes with Hover/Click Preview -->
          <Grid v-if="localGraph && localGraph.neighborNodes.length > 0" variant="y" gap="xs">
            <Grid variant="x_between">
              <Body variant="xxsMono" color="muted" uppercase>
                Cross-References ({{ localGraph.neighborNodes.length }})
              </Body>
              <Button size="xs" variant="text" color="primary" @click="viewMode = 'links'">
                Open Link Previewer →
              </Button>
            </Grid>

            <Grid
              v-for="neighbor in localGraph.neighborNodes"
              :key="neighbor.id"
              variant="x_auto_1fr_auto"
              gap="xs"
              padding="xs"
              surface="panel"
              border="all"
              rounded
              interactive
              @click="emit('select-entity', neighbor.entity)"
            >
              <Badge :label="neighbor.type" :entity-type="neighbor.type" dot />
              <Body variant="sMedium" truncate>{{ neighbor.label }}</Body>
              <Button
                size="xs"
                variant="tonal"
                color="secondary"
                @click.stop="previewTarget = neighbor.entity; viewMode = 'links'"
              >
                Preview
              </Button>
            </Grid>
          </Grid>

          <!-- Editable Attributes -->
          <Grid variant="y" gap="xs">
            <Grid variant="x_between">
              <Body variant="xxsMono" color="muted" uppercase>
                Attributes (Double-click to edit)
              </Body>
              <TextInput
                v-model="fieldSearch"
                placeholder="Filter keys..."
              />
            </Grid>

            <FieldRenderer
              :fields="filteredFields"
              :active-field-key="activeFieldKey"
              editable
              @update-field="handleInlineFieldUpdate"
            />
          </Grid>
        </Grid>

        <!-- 2. EDITABLE TABLE VIEW -->
        <Grid v-else-if="viewMode === 'table'" variant="y" gap="sm" padding="sm">
          <Grid variant="x_between">
            <Body variant="xxsMono" color="primary" uppercase>
              Inline Attribute Editor ({{ filteredFields.length }})
            </Body>
            <TextInput v-model="fieldSearch" placeholder="Search key or value..." />
          </Grid>
          <FieldRenderer
            :fields="filteredFields"
            :active-field-key="activeFieldKey"
            editable
            @update-field="handleInlineFieldUpdate"
          />
        </Grid>

        <!-- 3. LINKS & PEEK PREVIEW VIEW -->
        <Grid v-else-if="viewMode === 'links'" variant="y" gap="md" padding="sm">
          <Card padding="sm" gap="xs">
            <Body variant="xxsMono" color="primary" uppercase>
              Cross-Location Reference Navigator
            </Body>
            <Body variant="xsRegular" color="muted">
              Inspect connected records across tables, files, and graph edges without losing your current context.
            </Body>
          </Card>

          <Grid v-if="localGraph" variant="y" gap="xs">
            <Grid
              v-for="neighbor in localGraph.neighborNodes"
              :key="neighbor.id"
              variant="x_auto_1fr_auto"
              gap="xs"
              padding="xs"
              surface="panel"
              border="all"
              rounded
              interactive
              :selected="previewTarget?.id === neighbor.id"
              @click="previewTarget = neighbor.entity"
            >
              <Badge :label="neighbor.type" :entity-type="neighbor.type" />
              <Grid variant="y">
                <Body variant="sSemiBold" truncate>{{ neighbor.label }}</Body>
                <Body variant="xxsMono" color="muted">ID: {{ neighbor.id }} · Owner: {{ neighbor.entity.author?.handle }}</Body>
              </Grid>
              <Grid variant="x" gap="xss">
                <Button size="xs" variant="tonal" color="info" @click.stop="previewTarget = neighbor.entity">
                  Peek
                </Button>
                <Button size="xs" variant="flat" color="primary" @click.stop="emit('select-entity', neighbor.entity)">
                  Jump →
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <!-- Peek Preview Card -->
          <Card v-if="previewTarget" padding="md" gap="sm" elevated>
            <Grid variant="x_between">
              <Grid variant="x" gap="xs">
                <Badge label="PEEK PREVIEW" role="info" variant="flat" />
                <Badge :label="previewTarget.type" :entity-type="previewTarget.type" />
              </Grid>
              <Button size="xs" color="primary" variant="tonal" @click="emit('select-entity', previewTarget)">
                Open Full Inspector →
              </Button>
            </Grid>
            <Body variant="mBold">{{ previewTarget.label }}</Body>
            <Body variant="xsRegular" color="muted">{{ previewTarget.description }}</Body>
            <FieldRenderer :fields="previewTarget.fields" compact />
          </Card>
        </Grid>

        <!-- 4. GRAPH VIEW -->
        <Grid v-else-if="viewMode === 'graph'" variant="full" full-height>
          <EntityGraphView
            :entity="entity"
            :subgraph-data="localGraph"
            height="100%"
            :is-expanded="true"
            @select-entity="ent => emit('select-entity', ent)"
            @toggle-expand="viewMode = 'split'"
          />
        </Grid>

        <!-- 5. RAW JSON VIEW -->
        <Grid v-else-if="viewMode === 'json'" variant="y" gap="xs" padding="sm">
          <Grid variant="x_between">
            <Body variant="xxsMono" color="muted" uppercase>Raw JSON Serialization</Body>
            <AppCopyBtn :text="JSON.stringify(entity, null, 2)" label="Copy JSON" />
          </Grid>
          <Card padding="sm" surface="panel">
            <Body as="pre" variant="xsMono" color="success">{{ JSON.stringify(entity, null, 2) }}</Body>
          </Card>
        </Grid>
      </Grid>
    </template>

    <!-- CASE 2: FILE NODE INSPECTOR -->
    <template v-else-if="fileNode">
      <Grid variant="y" gap="sm" padding="sm" surface="elevated" border="b">
        <Grid variant="x_between">
          <Grid variant="x" gap="xs">
            <Badge
              :label="fileNode.type === 2 ? 'DIRECTORY' : fileNode.type === 1 ? 'JSON FILE' : 'BINARY'"
              :role="fileNode.type === 2 ? 'warning' : 'primary'"
              dot
            />
            <AppCopyBtn :text="fileNode.id" :label="fileNode.id" />
          </Grid>

          <Grid variant="x" gap="xs">
            <Button
              v-if="fileNode.type !== 2"
              color="secondary"
              variant="tonal"
              size="xs"
              prepend-icon="mdi-source-pull"
              @click="emit('propose-mr-file', fileNode)"
            >
              Propose MR
            </Button>
            <Button icon="mdi-close" variant="text" size="xs" @click="emit('close')" />
          </Grid>
        </Grid>

        <Body variant="lgBold" truncate>{{ fileNode.name }}</Body>

        <Grid v-if="fileNode.author" variant="x_between" padding="xs" surface="panel" border="all" rounded>
          <Body variant="xxsMono" color="muted">Owner: {{ fileNode.author.name }}</Body>
          <Body variant="xxsMono" color="primary">{{ fileNode.author.handle }}</Body>
        </Grid>
      </Grid>

      <Grid variant="y" gap="sm" padding="sm" full-height scrollable>
        <Grid variant="x_between">
          <Body variant="xxsMono" color="muted" uppercase>Editable JSON Payload</Body>
          <Grid variant="x" gap="xs">
            <AppCopyBtn :text="fileNode.content_json || ''" label="Copy" />
            <Button
              color="primary"
              variant="flat"
              size="xs"
              prepend-icon="mdi-content-save"
              @click="emit('save-file', { id: fileNode.id, content_json: fileNode.content_json })"
            >
              Save Direct
            </Button>
          </Grid>
        </Grid>

        <v-textarea
          v-model="fileNode.content_json"
          variant="outlined"
          color="primary"
          rows="18"
          hide-details
        />
      </Grid>
    </template>

    <!-- Footer -->
    <Grid variant="x_between" padding="xs" surface="elevated" border="t">
      <Body variant="xxsMono" color="muted">JetBrains Context Inspector</Body>
      <Button variant="text" size="xs" color="default" @click="emit('close')">
        Hide Panel
      </Button>
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-right-inspector {
  width: 460px;
}
</style>