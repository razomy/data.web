<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type {
  DataAuthor,
  Entity,
  FsNodeRecord,
  MergeRequest,
  MergeRequestFieldChange,
} from '~/razomy/abstractions/graph';
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Card from '~/razomy/ds-vue/card/Card.vue';
import Body from '~/razomy/ds-vue/typography/Body.vue';
import Button from '~/razomy/ds-vue/button/Button.vue';
import Badge from '~/razomy/ds-vue/elements/Badge.vue';
import TextInput from '~/razomy/ds-vue/input/TextInput.vue';

const props = defineProps<{
  drawerOpen: boolean;
  createOpen: boolean;
  mergeRequests: MergeRequest[];
  currentUser: DataAuthor;
  targetEntity?: Entity | null;
  targetFile?: FsNodeRecord | null;
  availableEntities: Entity[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:drawerOpen', val: boolean): void;
  (e: 'update:createOpen', val: boolean): void;
  (e: 'review-mr', payload: { mrId: string; action: 'approve' | 'reject'; comment?: string }): void;
  (e: 'create-mr', payload: {
    title: string;
    description: string;
    sourceBranch: string;
    targetType: 'entity' | 'fsNode';
    targetId: string;
    changes: MergeRequestFieldChange[];
    proposedJsonContent?: string;
  }): void;
  (e: 'inspect-target', targetId: string): void;
}>();

const statusTab = ref<'open' | 'merged' | 'rejected' | 'all'>('open');
const reviewComments = ref<Record<string, string>>({});

const filteredMrs = computed(() => {
  if (statusTab.value === 'all') return props.mergeRequests;
  return props.mergeRequests.filter(m => m.status === statusTab.value);
});

const selectedTargetId = ref('e1');
const mrTitle = ref('');
const mrDescription = ref('');
const mrBranch = ref('');
const fieldEdits = ref<{ fieldKey: string; oldValue: string; newValue: string; fieldType: any }[]>([]);
const fileContentEdit = ref('');

const resolvedTargetEntity = computed(() => {
  if (props.targetEntity) return props.targetEntity;
  return props.availableEntities.find(e => e.id === selectedTargetId.value) || props.availableEntities[0] || null;
});

function initCreateForm() {
  if (props.targetFile) {
    mrTitle.value = `chore(${props.targetFile.name}): Update JSON file configuration`;
    mrDescription.value = `Proposed update to file ${props.targetFile.name} owned by ${props.targetFile.author?.name || 'Owner'}.`;
    mrBranch.value = `patch/${props.currentUser.handle.replace('@', '')}-${props.targetFile.id}`;
    fileContentEdit.value = props.targetFile.content_json;
    return;
  }

  const ent = props.targetEntity || resolvedTargetEntity.value;
  if (!ent) return;
  selectedTargetId.value = ent.id;
  mrTitle.value = `feat(${ent.id}): Update ${ent.label} data attributes`;
  mrDescription.value = `Proposing attribute updates for ${ent.label} (Owner: ${ent.author?.name || 'Sarah Chen'}).`;
  mrBranch.value = `feat/${props.currentUser.handle.replace('@', '')}-update-${ent.id}`;
  fieldEdits.value = ent.fields.slice(0, 6).map(f => ({
    fieldKey: f.key,
    oldValue: Array.isArray(f.value) ? f.value.join(', ') : String(f.value),
    newValue: Array.isArray(f.value) ? f.value.join(', ') : String(f.value),
    fieldType: f.type,
  }));
}

watch(
  () => [props.createOpen, props.targetEntity, props.targetFile],
  ([open]) => {
    if (open) initCreateForm();
  },
  { immediate: true }
);

function submitNewMr() {
  if (props.targetFile) {
    emit('create-mr', {
      title: mrTitle.value,
      description: mrDescription.value,
      sourceBranch: mrBranch.value,
      targetType: 'fsNode',
      targetId: props.targetFile.id,
      changes: [
        {
          fieldKey: 'content_json',
          oldValue: props.targetFile.content_json.slice(0, 120) + '...',
          newValue: fileContentEdit.value.slice(0, 120) + '...',
          fieldType: 'json',
        },
      ],
      proposedJsonContent: fileContentEdit.value,
    });
    return;
  }

  const changedOnly = fieldEdits.value.filter(f => f.newValue !== f.oldValue);
  const firstEdit = fieldEdits.value[0];
  const finalChanges =
    changedOnly.length > 0
      ? changedOnly
      : firstEdit
      ? [
          {
            fieldKey: firstEdit.fieldKey,
            oldValue: firstEdit.oldValue,
            newValue: firstEdit.newValue + ' (updated)',
            fieldType: firstEdit.fieldType,
          },
        ]
      : [];

  emit('create-mr', {
    title: mrTitle.value,
    description: mrDescription.value,
    sourceBranch: mrBranch.value,
    targetType: 'entity',
    targetId: (props.targetEntity || resolvedTargetEntity.value)?.id || 'e1',
    changes: finalChanges,
  });
}
</script>

<template>
  <!-- 1. MERGE REQUESTS REVIEW DIALOG -->
  <v-dialog
    :model-value="drawerOpen"
    max-width="860"
    scrollable
    @update:model-value="emit('update:drawerOpen', $event)"
  >
    <v-card>
      <Grid variant="x_between" padding="md" surface="elevated" border="b">
        <Grid variant="x" gap="sm">
          <v-icon icon="mdi-source-merge" color="primary" size="22" />
          <Grid variant="y">
            <Body variant="lgBold">Git Data Merge Requests</Body>
            <Body variant="xxsMono" color="muted">
              Active Reviewer: {{ currentUser.name }} ({{ currentUser.handle }})
            </Body>
          </Grid>
        </Grid>

        <Grid variant="x" gap="xs">
          <Button
            color="secondary"
            variant="tonal"
            size="sm"
            prepend-icon="mdi-plus"
            @click="emit('update:drawerOpen', false); emit('update:createOpen', true)"
          >
            New Merge Request
          </Button>
          <Button icon="mdi-close" variant="text" size="xs" @click="emit('update:drawerOpen', false)" />
        </Grid>
      </Grid>

      <!-- Status Filter Bar -->
      <Grid variant="x_between" padding="sm" surface="panel" border="b">
        <Grid variant="x" gap="xs">
          <Badge
            :label="`Open (${mergeRequests.filter(m => m.status === 'open').length})`"
            role="primary"
            :active="statusTab === 'open'"
            clickable
            @click="statusTab = 'open'"
          />
          <Badge
            :label="`Merged (${mergeRequests.filter(m => m.status === 'merged').length})`"
            role="secondary"
            :active="statusTab === 'merged'"
            clickable
            @click="statusTab = 'merged'"
          />
          <Badge
            :label="`Rejected (${mergeRequests.filter(m => m.status === 'rejected').length})`"
            role="error"
            :active="statusTab === 'rejected'"
            clickable
            @click="statusTab = 'rejected'"
          />
          <Badge
            :label="`All (${mergeRequests.length})`"
            role="neutral"
            :active="statusTab === 'all'"
            clickable
            @click="statusTab = 'all'"
          />
        </Grid>
        <Body variant="xxsMono" color="muted">Data Owners approve or reject schema & record changes</Body>
      </Grid>

      <!-- MR List -->
      <v-card-text>
        <Grid variant="y" gap="md">
          <Card v-for="mr in filteredMrs" :key="mr.id" padding="md" gap="sm">
            <Grid variant="x_between" align="start">
              <Grid variant="y" gap="xs">
                <Grid variant="x_start" gap="xs">
                  <Badge
                    :label="`!${mr.mrNumber} ${mr.status.toUpperCase()}`"
                    :role="mr.status === 'open' ? 'primary' : mr.status === 'merged' ? 'secondary' : 'error'"
                    variant="flat"
                  />
                  <Badge :label="`${mr.sourceBranch} → ${mr.targetBranch}`" role="info" />
                  <Button
                    size="xs"
                    variant="text"
                    color="primary"
                    @click="emit('inspect-target', mr.targetId); emit('update:drawerOpen', false)"
                  >
                    Target: {{ mr.targetLabel }} ({{ mr.targetId }})
                  </Button>
                </Grid>

                <Body variant="mBold">{{ mr.title }}</Body>
                <Body variant="xsRegular" color="muted">{{ mr.description }}</Body>
              </Grid>

              <Grid variant="y" gap="xss">
                <Body variant="xxsMono" color="muted">Author: {{ mr.author.name }}</Body>
                <Badge :label="`Owner: ${mr.dataOwner.handle}`" role="secondary" />
              </Grid>
            </Grid>

            <!-- Proposed Diff Grid -->
            <Grid variant="y" gap="xss" padding="xs" surface="panel" border="all" rounded>
              <Body variant="xxsMono" color="muted" uppercase>
                Proposed Diff ({{ mr.changes.length }} attribute change{{ mr.changes.length === 1 ? '' : 's' }})
              </Body>
              <Grid
                v-for="change in mr.changes"
                :key="change.fieldKey"
                variant="x_three"
                gap="xs"
                padding="xs"
                surface="default"
                border="b"
              >
                <Body variant="xsMono" color="default">{{ change.fieldKey }}</Body>
                <Body variant="xsMono" color="danger" truncate>- {{ change.oldValue }}</Body>
                <Body variant="xsMono" color="success" truncate>+ {{ change.newValue }}</Body>
              </Grid>
            </Grid>

            <!-- Review Actions -->
            <Grid v-if="mr.status === 'open'" variant="x_1fr_auto" gap="sm">
              <TextInput
                v-model="reviewComments[mr.id]!"
                placeholder="Review note from Data Owner..."
              />
              <Grid variant="x" gap="xs">
                <Button
                  color="error"
                  variant="tonal"
                  size="sm"
                  prepend-icon="mdi-close-circle-outline"
                  :loading="loading"
                  @click="emit('review-mr', { mrId: mr.id, action: 'reject', comment: reviewComments[mr.id] })"
                >
                  Reject
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  prepend-icon="mdi-check-decagram"
                  :loading="loading"
                  @click="emit('review-mr', { mrId: mr.id, action: 'approve', comment: reviewComments[mr.id] })"
                >
                  Approve & Merge
                </Button>
              </Grid>
            </Grid>
            <Grid v-else variant="x_between">
              <Body variant="xsMono" color="muted">
                Reviewed by {{ mr.reviewedBy?.name || mr.dataOwner.name }}: "{{ mr.reviewComment }}"
              </Body>
              <Body variant="xxsMono" color="light">{{ new Date(mr.updatedAt).toLocaleString() }}</Body>
            </Grid>
          </Card>
        </Grid>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 2. CREATE MERGE REQUEST DIALOG -->
  <v-dialog
    :model-value="createOpen"
    max-width="680"
    scrollable
    @update:model-value="emit('update:createOpen', $event)"
  >
    <v-card>
      <Grid variant="x_between" padding="md" surface="elevated" border="b">
        <Grid variant="x" gap="xs">
          <v-icon icon="mdi-source-pull" color="secondary" size="20" />
          <Body variant="lgBold">Create Data Merge Request</Body>
        </Grid>
        <Button icon="mdi-close" variant="text" size="xs" @click="emit('update:createOpen', false)" />
      </Grid>

      <v-card-text>
        <Grid variant="y" gap="md">
          <Grid variant="x_between" padding="xs" surface="panel" border="all" rounded>
            <Body variant="xsMono">Author: {{ currentUser.name }} ({{ currentUser.handle }})</Body>
            <Body v-if="resolvedTargetEntity" variant="xsMono" color="primary">
              Reviewer: {{ resolvedTargetEntity.author?.name }}
            </Body>
          </Grid>

          <Grid variant="x_two" gap="sm">
            <TextInput v-model="mrTitle" label="MR Title" />
            <TextInput v-model="mrBranch" label="Source Branch" mono />
          </Grid>

          <TextInput v-model="mrDescription" label="Description" />

          <Grid v-if="!targetFile" variant="y" gap="xs">
            <Body variant="xxsMono" color="primary" uppercase>Modify Field Values to Generate Diff</Body>
            <Grid
              v-for="item in fieldEdits"
              :key="item.fieldKey"
              variant="x_three"
              gap="xs"
              padding="xs"
              surface="panel"
              border="all"
              rounded
            >
              <Body variant="xsMono" color="muted" truncate>{{ item.fieldKey }}</Body>
              <Body variant="xxsMono" color="light" truncate>Was: {{ item.oldValue }}</Body>
              <TextInput v-model="item.newValue" mono />
            </Grid>
          </Grid>

          <Grid v-else variant="y" gap="xs">
            <Body variant="xxsMono" color="primary" uppercase>Proposed JSON Content</Body>
            <v-textarea v-model="fileContentEdit" variant="outlined" rows="8" hide-details />
          </Grid>
        </Grid>
      </v-card-text>

      <Grid variant="x_end" gap="xs" padding="md" surface="elevated" border="t">
        <Button variant="text" @click="emit('update:createOpen', false)">Cancel</Button>
        <Button
          color="primary"
          variant="flat"
          prepend-icon="mdi-source-pull"
          :loading="loading"
          @click="submitNewMr"
        >
          Submit Merge Request
        </Button>
      </Grid>
    </v-card>
  </v-dialog>
</template>
