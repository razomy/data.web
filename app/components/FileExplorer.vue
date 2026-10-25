<script setup lang="ts">
import { computed, ref } from 'vue';
import { FsNodeType } from '~/razomy/abstractions/graph';
import type { FsNodeRecord } from '~/razomy/abstractions/graph';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Card from '~/razomy/ui-vue/card/Card.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Button from '~/razomy/ui-vue/button/Button.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';
import TextInput from '~/razomy/ui-vue/input/TextInput.vue';

const props = defineProps<{
  files: FsNodeRecord[];
  breadcrumbItems: { name: string; id: string }[];
  currentFolderId: string | null;
  selectedFileId?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate-folder', folderId: string | null): void;
  (e: 'select-file', file: FsNodeRecord): void;
  (e: 'create-node', payload: { name: string; type: FsNodeType }): void;
  (e: 'rename-node', payload: { id: string; name: string }): void;
  (e: 'move-node', payload: { id: string; parentId: string | null }): void;
  (e: 'delete-node', file: FsNodeRecord): void;
  (e: 'propose-mr', file: FsNodeRecord): void;
}>();

const fileSearch = ref('');

const dialogs = ref({
  create: false,
  rename: false,
  move: false,
});

const newFileState = ref<{ name: string; type: FsNodeType }>({
  name: '',
  type: FsNodeType.FileJson,
});

const activeActionItem = ref<FsNodeRecord | null>(null);
const moveTargetId = ref<string>('');

const filteredFiles = computed(() => {
  if (!fileSearch.value.trim()) return props.files;
  const q = fileSearch.value.trim().toLowerCase();
  return props.files.filter(
    f =>
      f.name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      f.author?.name.toLowerCase().includes(q)
  );
});

function handleItemClick(item: FsNodeRecord) {
  if (item.type === FsNodeType.Directory) {
    emit('navigate-folder', item.id);
  } else {
    emit('select-file', item);
  }
}

function navigateUp() {
  if (props.breadcrumbItems.length <= 1) {
    emit('navigate-folder', null);
  } else {
    const parentCrumb = props.breadcrumbItems[props.breadcrumbItems.length - 2];
    emit('navigate-folder', parentCrumb ? parentCrumb.id : null);
  }
}

function openCreateDialog(type: FsNodeType) {
  newFileState.value = { name: '', type };
  dialogs.value.create = true;
}

function submitCreate() {
  if (!newFileState.value.name.trim()) return;
  emit('create-node', {
    name: newFileState.value.name.trim(),
    type: newFileState.value.type,
  });
  dialogs.value.create = false;
}

function openRenameDialog(item: FsNodeRecord) {
  activeActionItem.value = { ...item };
  dialogs.value.rename = true;
}

function submitRename() {
  if (!activeActionItem.value) return;
  emit('rename-node', {
    id: activeActionItem.value.id,
    name: activeActionItem.value.name,
  });
  dialogs.value.rename = false;
}

function openMoveDialog(item: FsNodeRecord) {
  activeActionItem.value = { ...item };
  moveTargetId.value = item.parentId || '';
  dialogs.value.move = true;
}

function submitMove() {
  if (!activeActionItem.value) return;
  emit('move-node', {
    id: activeActionItem.value.id,
    parentId: moveTargetId.value.trim() || null,
  });
  dialogs.value.move = false;
}
</script>

<template>
  <Grid variant="y" gap="md" padding="md" scrollable full-height>
    <!-- Top Breadcrumbs & Actions -->
    <Card padding="sm">
      <Grid variant="x_between" gap="sm">
        <Grid variant="x_start" gap="xss">
          <Button
            variant="text"
            size="xs"
            color="primary"
            prepend-icon="mdi-home-outline"
            @click="emit('navigate-folder', null)"
          >
            Root
          </Button>
          <template v-for="crumb in breadcrumbItems" :key="crumb.id">
            <v-icon icon="mdi-chevron-right" size="14" />
            <Button
              variant="text"
              size="xs"
              color="default"
              @click="emit('navigate-folder', crumb.id)"
            >
              {{ crumb.name }}
            </Button>
          </template>
        </Grid>

        <Grid variant="x" gap="xs">
          <TextInput
            v-model="fileSearch"
            placeholder="Filter partition..."
            icon="mdi-magnify"
            clearable
            @clear="fileSearch = ''"
          />
          <Button
            color="primary"
            variant="tonal"
            size="sm"
            prepend-icon="mdi-folder-plus"
            @click="openCreateDialog(FsNodeType.Directory)"
          >
            New Folder
          </Button>
          <Button
            color="secondary"
            variant="tonal"
            size="sm"
            prepend-icon="mdi-file-plus"
            @click="openCreateDialog(FsNodeType.FileJson)"
          >
            New JSON
          </Button>
        </Grid>
      </Grid>
    </Card>

    <!-- File List -->
    <Card padding="none" gap="none">
      <Grid variant="x_between" padding="sm" surface="elevated" border="b">
        <Body variant="xsMono" color="muted">
          {{ filteredFiles.length }} node(s) in current directory
        </Body>
        <Button
          v-if="currentFolderId"
          variant="text"
          size="xs"
          color="primary"
          prepend-icon="mdi-arrow-up"
          @click="navigateUp"
        >
          Up one level
        </Button>
      </Grid>

      <Grid v-if="filteredFiles.length === 0" padding="lg" variant="y" align="center">
        <Body variant="sMedium" color="muted">This directory is empty</Body>
      </Grid>

      <Grid
        v-for="file in filteredFiles"
        :key="file.id"
        variant="x_auto_1fr_auto"
        gap="sm"
        padding="sm"
        border="b"
        interactive
        :selected="selectedFileId === file.id"
        @click="handleItemClick(file)"
      >
        <v-icon
          :icon="
            file.type === FsNodeType.Directory
              ? 'mdi-folder'
              : file.type === FsNodeType.FileJson
              ? 'mdi-code-json'
              : 'mdi-file-binary-outline'
          "
          :color="
            file.type === FsNodeType.Directory
              ? 'warning'
              : file.type === FsNodeType.FileJson
              ? 'primary'
              : 'info'
          "
          size="20"
        />

        <Grid variant="y" gap="xss">
          <Body variant="sSemiBold">{{ file.name }}</Body>
          <Body variant="xxsMono" color="muted">
            ID: {{ file.id }} · Owner: {{ file.author?.name || 'Sarah Chen' }} · Updated {{ new Date(file.updatedAt).toLocaleDateString() }}
          </Body>
        </Grid>

        <Grid variant="x" gap="xs" @click.stop>
          <Button
            v-if="file.type !== FsNodeType.Directory"
            variant="tonal"
            color="secondary"
            size="xs"
            prepend-icon="mdi-source-pull"
            @click="emit('propose-mr', file)"
          >
            MR
          </Button>

          <Badge
            :label="file.type === FsNodeType.Directory ? 'DIR' : file.type === FsNodeType.FileJson ? 'JSON' : 'BIN'"
            :role="file.type === FsNodeType.Directory ? 'warning' : 'primary'"
          />

          <Button size="xs" variant="text" icon="mdi-pencil" @click="openRenameDialog(file)" />
          <Button size="xs" variant="text" icon="mdi-folder-move" @click="openMoveDialog(file)" />
          <Button size="xs" variant="text" color="error" icon="mdi-delete" @click="emit('delete-node', file)" />
        </Grid>
      </Grid>
    </Card>

    <!-- Create Dialog -->
    <v-dialog v-model="dialogs.create" max-width="440">
      <v-card>
        <Grid variant="y" gap="md" padding="md">
          <Body variant="lgBold">
            Create {{ newFileState.type === FsNodeType.Directory ? 'Directory' : 'JSON File' }}
          </Body>
          <TextInput
            v-model="newFileState.name"
            placeholder="Name (e.g. schema.json)"
            @enter="submitCreate"
          />
          <Grid variant="x_end" gap="xs">
            <Button variant="text" @click="dialogs.create = false">Cancel</Button>
            <Button variant="flat" color="primary" @click="submitCreate">Create</Button>
          </Grid>
        </Grid>
      </v-card>
    </v-dialog>

    <!-- Rename Dialog -->
    <v-dialog v-model="dialogs.rename" max-width="440">
      <v-card>
        <Grid variant="y" gap="md" padding="md">
          <Body variant="lgBold">Rename Node</Body>
          <TextInput
            v-if="activeActionItem"
            v-model="activeActionItem.name"
            @enter="submitRename"
          />
          <Grid variant="x_end" gap="xs">
            <Button variant="text" @click="dialogs.rename = false">Cancel</Button>
            <Button variant="flat" color="primary" @click="submitRename">Save</Button>
          </Grid>
        </Grid>
      </v-card>
    </v-dialog>

    <!-- Move Dialog -->
    <v-dialog v-model="dialogs.move" max-width="440">
      <v-card>
        <Grid variant="y" gap="md" padding="md">
          <Body variant="lgBold">Move "{{ activeActionItem?.name }}"</Body>
          <TextInput
            v-model="moveTargetId"
            placeholder="Target Folder ID (blank = Root)"
            @enter="submitMove"
          />
          <Grid variant="x_end" gap="xs">
            <Button variant="text" @click="dialogs.move = false">Cancel</Button>
            <Button variant="flat" color="primary" @click="submitMove">Move</Button>
          </Grid>
        </Grid>
      </v-card>
    </v-dialog>
  </Grid>
</template>
