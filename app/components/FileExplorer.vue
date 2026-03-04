<template>
  <v-container fluid>
    <!-- Top Bar: Breadcrumbs and Actions -->
    <v-toolbar flat color="background" class="mb-4 rounded border">
      <v-breadcrumbs :items="breadcrumbItems as any" class="pa-0 pl-4">
        <template v-slot:item="{ item }">
          <v-breadcrumbs-item
              style="cursor: pointer; color: #1976D2;"
              @click="navigateToFolder((item as any).id)"
          >
            {{ (item as any).name }}
          </v-breadcrumbs-item>
        </template>
        <template v-slot:divider>
          <v-icon icon="mdi-chevron-right"></v-icon>
        </template>
      </v-breadcrumbs>

      <v-spacer></v-spacer>

      <v-btn color="primary" variant="text" prepend-icon="mdi-folder-plus"
             @click="openCreateDialog(FsNodeType.Directory)">
        New Folder
      </v-btn>
      <v-btn color="primary" variant="text" prepend-icon="mdi-file-plus" @click="openCreateDialog(FsNodeType.FileJson)">
        New File
      </v-btn>
    </v-toolbar>

    <!-- Main Split Layout (1/2 Columns) -->
    <v-row class="fill-height align-start">

      <!-- Left side: Mac-style File List -->
      <v-col md="6" cols="12" class="pt-0">
        <v-card variant="outlined" class="file-list-card bg-surface">
          <v-list density="comfortable" class="pa-0">
            <!-- Empty State for Folder -->
            <v-list-item v-if="files.length === 0" class="text-center text-grey py-10">
              <v-icon icon="mdi-folder-open-outline" size="48" class="mb-2"></v-icon>
              <v-list-item-title>This folder is empty.</v-list-item-title>
            </v-list-item>

            <!-- File/Folder Items -->
            <v-list-item
                v-for="file in files"
                :key="file.id"
                :active="activeFile?.id === file.id"
                color="primary"
                class="border-b list-item-mac"
                @click="handleItemClick(file)"
            >
              <template v-slot:prepend>
                <v-icon
                    :icon="file.type === FsNodeType.Directory ? 'mdi-folder' : 'mdi-file-document'"
                    :color="file.type === FsNodeType.Directory ? 'amber-darken-2' : 'blue-grey'"
                ></v-icon>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ file.name }}
              </v-list-item-title>

              <template v-slot:append>
                <!-- Mac-style chevron for directories -->
                <v-icon
                    v-if="file.type === FsNodeType.Directory"
                    icon="mdi-chevron-right"
                    color="grey-lighten-1"
                    class="mr-2"
                ></v-icon>

                <!-- Context Menu -->
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" density="compact" v-bind="props" @click.stop></v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil" title="Rename"
                                 @click.stop="openRenameDialog(file)"></v-list-item>
                    <v-list-item prepend-icon="mdi-folder-move" title="Move"
                                 @click.stop="openMoveDialog(file)"></v-list-item>
                    <v-list-item prepend-icon="mdi-delete" title="Delete" color="error"
                                 @click.stop="deleteItem(file)"></v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right side: File Editor Panel (Always Open) -->
      <v-col md="6" cols="12" class="pt-0">
        <div class="editor-side-panel">
          <v-card class="h-100 d-flex flex-column border" flat>

            <!-- Editor View -->
            <template v-if="activeFile">
              <v-toolbar color="surface" border="bottom" density="compact">
                <v-btn icon="mdi-close" variant="text" size="small" @click="closeEditor"></v-btn>
                <v-toolbar-title class="text-body-1 font-weight-bold ml-0">
                  {{ activeFile.name }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click="saveFileContent" :loading="loading">Save</v-btn>
              </v-toolbar>

              <v-card-text class="pa-0 flex-grow-1">
                <v-textarea
                    v-model="activeFile.content_json"
                    auto-grow
                    hide-details
                    class="h-100 editor-textarea"
                    bg-color="#1e1e1e"
                    theme="dark"
                ></v-textarea>
              </v-card-text>
            </template>

            <!-- Empty State for Editor Panel -->
            <template v-else>
              <div class="d-flex flex-column align-center justify-center h-100 text-grey-darken-1 bg-surface-light">
                <v-icon icon="mdi-file-document-outline" size="64" class="mb-4 opacity-50"></v-icon>
                <h3 class="font-weight-regular">No file selected</h3>
                <p class="text-caption mt-2">Select a file from the list to view or edit.</p>
              </div>
            </template>

          </v-card>
        </div>
      </v-col>
    </v-row>

    <!-- CREATE DIALOG -->
    <v-dialog v-model="dialogs.create" max-width="500">
      <v-card>
        <v-card-title>Create {{ newFileState.type === FsNodeType.Directory ? 'Folder' : 'File' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="newFileState.name" label="Name" autofocus @keyup.enter="createItem"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.create = false">Cancel</v-btn>
          <v-btn color="primary" @click="createItem" :loading="loading">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- RENAME DIALOG -->
    <v-dialog v-model="dialogs.rename" max-width="500">
      <v-card>
        <v-card-title>Rename Item</v-card-title>
        <v-card-text>
          <v-text-field
              v-if="activeActionItem"
              v-model="activeActionItem.name" label="New Name" autofocus @keyup.enter="renameItem"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.rename = false">Cancel</v-btn>
          <v-btn color="primary" @click="renameItem" :loading="loading">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MOVE DIALOG -->
    <v-dialog v-model="dialogs.move" max-width="500">
      <v-card>
        <v-card-title>Move "{{ activeActionItem?.name }}"</v-card-title>
        <v-card-text>
          <p class="mb-2">Enter the ID of the new parent folder (leave blank for root):</p>
          <v-text-field v-model="moveTargetId" label="Parent Folder ID"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.move = false">Cancel</v-btn>
          <v-btn color="primary" @click="moveItem" :loading="loading">Move</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {FsNodeType} from '~~/generated/enums';
import type {FsNode} from '~~/generated/browser';

const route = useRoute()
const router = useRouter()

const currentFolderId = ref<string | null>(null)
const files = ref<FsNode[]>([])
const breadcrumbItems = ref<{ name: string, id: string | null }[]>([{name: 'Root', id: null}])
const loading = ref<boolean>(false)

// Dialog states
const dialogs = ref({
  create: false,
  rename: false,
  move: false
})

// Temp states for actions
const newFileState = ref<{ name: string, type: FsNodeType }>({name: '', type: FsNodeType.FileJson})
const activeFile = ref<FsNode | null>(null)
const activeActionItem = ref<FsNode | null>(null)
const moveTargetId = ref<string>('')

// --- URL SYNCHRONIZATION ---

watch(() => route.query, async (newQuery) => {
  let needsFetch = false;
  const newFolderId = (newQuery.folderId as string) || null;

  if (currentFolderId.value !== newFolderId) {
    currentFolderId.value = newFolderId;
    needsFetch = true;
  }

  if (needsFetch) {
    await fetchFiles();
  }

  const newFileId = newQuery.fileId as string;
  if (newFileId) {
    if (activeFile.value?.id !== newFileId) {
      const fileToOpen = files.value.find(f => f.id === newFileId);
      if (fileToOpen) {
        activeFile.value = {...fileToOpen};
      }
    }
  } else {
    activeFile.value = null;
  }
}, {deep: true});

// --- CORE FETCHING LOGIC ---

const fetchFiles = async () => {
  try {
    const url = currentFolderId.value
        ? `/api/fs/children?folderId=${currentFolderId.value}`
        : `/api/fs/children`;

    files.value = await $fetch<FsNode[]>(url)
    await fetchBreadcrumbs()
  } catch (err) {
    console.error('Failed to fetch files', err)
  }
}

const fetchBreadcrumbs = async () => {
  if (!currentFolderId.value) {
    breadcrumbItems.value = [{name: 'Root', id: null}]
    return
  }
  try {
    const crumbs = await $fetch<{ name: string, id: any }[]>(`/api/fs/breadcrumbs?id=${currentFolderId.value}`)
    breadcrumbItems.value = [{name: 'Root', id: null}, ...crumbs]
  } catch (err) {
    console.error('Failed to fetch breadcrumbs', err)
  }
}

// --- NAVIGATION & ROUTER PUSH ---

const handleItemClick = (item: FsNode) => {
  if (item.type === FsNodeType.Directory) {
    navigateToFolder(item.id)
  } else {
    openEditor(item)
  }
}

const navigateToFolder = (folderId: string | null) => {
  const query: any = {...route.query}
  if (folderId) {
    query.folderId = folderId;
  } else {
    delete query.folderId
  }
  delete query.fileId
  console.log(query);
  router.push({path: route.path, query})
}

// --- CRUD ACTIONS ---

const openCreateDialog = (type: FsNodeType) => {
  newFileState.value = {name: '', type}
  dialogs.value.create = true
}

const createItem = async () => {
  if (!newFileState.value.name) return
  loading.value = true
  try {
    await $fetch('/api/fs/create', {
      method: 'POST',
      body: {
        name: newFileState.value.name,
        type: newFileState.value.type,
        content_json: newFileState.value.type === FsNodeType.FileJson ? '' : null,
        content_binary: newFileState.value.type === FsNodeType.FileBinary ? '' : null,
        parentId: currentFolderId.value || null
      }
    })
    dialogs.value.create = false
    await fetchFiles()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to create')
  } finally {
    loading.value = false
  }
}

const openRenameDialog = (item: any) => {
  activeActionItem.value = {...item}
  dialogs.value.rename = true
}

const renameItem = async () => {
  loading.value = true
  try {
    await $fetch('/api/fs/rename', {
      method: 'PUT',
      body: {id: activeActionItem.value!.id, newName: activeActionItem.value!.name}
    })
    dialogs.value.rename = false
    await fetchFiles()
  } catch (err) {
    alert('Failed to rename')
  } finally {
    loading.value = false
  }
}

const openMoveDialog = (item: any) => {
  activeActionItem.value = {...item}
  moveTargetId.value = ''
  dialogs.value.move = true
}

const moveItem = async () => {
  loading.value = true
  try {
    await $fetch('/api/fs/move', {
      method: 'POST',
      body: {
        nodeId: activeActionItem.value!.id,
        newParentId: moveTargetId.value || null
      }
    })
    dialogs.value.move = false
    await fetchFiles()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to move')
  } finally {
    loading.value = false
  }
}

const deleteItem = async (item: any) => {
  if (!confirm(`Are you sure you want to delete ${item.name}?`)) return
  try {
    await $fetch('/api/fs/delete', {
      method: 'DELETE',
      body: {id: item.id}
    })

    if (activeFile.value?.id === item.id) closeEditor()
    await fetchFiles()
  } catch (err) {
    alert('Failed to delete')
  }
}

// --- EDITOR LOGIC ---

const openEditor = (item: FsNode) => {
  router.push({query: {...route.query, fileId: item.id}})
}

const closeEditor = () => {
  const query = {...route.query}
  delete query.fileId
  router.push({query})
}

const saveFileContent = async () => {
  loading.value = true
  try {
    await $fetch('/api/fs/save', {
      method: 'PUT',
      body: {id: activeFile.value!.id, content_json: activeFile.value!.content_json}
    })

    const idx = files.value.findIndex(f => f.id === activeFile.value!.id)
    if (idx !== -1) files.value![idx]!.content_json = activeFile.value!.content_json

  } catch (err) {
    alert('Failed to save file')
  } finally {
    loading.value = false
  }
}

// INITIALIZATION
onMounted(async () => {
  if (route.query.folderId) {
    currentFolderId.value = route.query.folderId as string
  }
  await fetchFiles()

  if (route.query.fileId) {
    const fileToOpen = files.value.find(f => f.id === route.query.fileId)
    if (fileToOpen) {
      activeFile.value = {...fileToOpen}
    }
  }
})
</script>

<style scoped>
/* File list styling */
.file-list-card {
  height: calc(100vh - 120px);
  min-height: 400px;
  overflow-y: auto;
}

.list-item-mac {
  border-bottom: 1px solid rgba(128, 128, 128, 0.15) !important;
}

.list-item-mac:hover {
  background-color: rgba(128, 128, 128, 0.05);
}

/* Sidebar behavior */
.editor-side-panel {
  position: sticky;
  top: 16px;
  height: calc(100vh - 120px);
  min-height: 400px;
}

/* Code Editor text-area */
.editor-textarea :deep(.v-field__input) {
  font-family: 'Courier New', Courier, monospace;
  height: 100% !important;
  color: #d4d4d4 !important;
  min-height: calc(100vh - 180px); /* Fill the box minus headers */
}

.editor-textarea :deep(.v-field) {
  height: 100%;
}
</style>