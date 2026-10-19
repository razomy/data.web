import { computed } from 'vue';
import { useState } from '#imports';
import type {
  DataAuthor,
  DatasetCollection,
  DataViewMode,
  Entity,
  EntityField,
  FsNodeRecord,
  FsNodeType,
  GraphEdge,
  GraphNode,
  LocalSubgraph,
  MergeRequest,
  MergeRequestFieldChange,
  TableRow,
} from '~/types/graph';
import { useGraphApi } from './useGraphApi';

export function useWorkspaceStore() {
  const api = useGraphApi();

  // Catalog & Authors
  const datasets = useState<DatasetCollection[]>('ws-datasets', () => []);
  const authors = useState<DataAuthor[]>('ws-authors', () => []);
  const currentUserId = useState<string>('ws-current-user-id', () => 'usr-sarah');
  const activeDatasetId = useState<string>('ws-active-dataset-id', () => 'ds-all');
  const activeAuthorFilter = useState<string>('ws-author-filter', () => 'all');

  // Active View Mode ('table' | 'cards' | 'files' | 'graph' | 'text' | 'search')
  const viewMode = useState<DataViewMode>('ws-view-mode', () => 'table');

  // JetBrains Tool Docks State
  const leftToolOpen = useState<boolean>('ws-left-tool-open', () => true);
  const rightToolOpen = useState<boolean>('ws-right-tool-open', () => true);
  const rightToolTab = useState<'inspector' | 'references' | 'preview' | 'git'>('ws-right-tool-tab', () => 'inspector');

  // Right Inspector & Link Navigation History
  const inspectedEntity = useState<Entity | null>('ws-inspected-entity', () => null);
  const inspectedSubgraph = useState<LocalSubgraph | null>('ws-inspected-subgraph', () => null);
  const inspectedFile = useState<FsNodeRecord | null>('ws-inspected-file', () => null);
  const activeFieldKey = useState<string | undefined>('ws-active-field-key', () => undefined);
  const previewEntity = useState<Entity | null>('ws-preview-entity', () => null);
  const navigationHistory = useState<{ id: string; label: string; type: string }[]>('ws-nav-history', () => []);

  // Table / Entities State
  const rows = useState<TableRow[]>('ws-rows', () => []);
  const totalRows = useState<number>('ws-total-rows', () => 0);
  const page = useState<number>('ws-page', () => 1);
  const pageSize = useState<number>('ws-page-size', () => 100);
  const totalPages = useState<number>('ws-total-pages', () => 1);
  const typeFilter = useState<string>('ws-type-filter', () => 'All');
  const searchQuery = useState<string>('ws-search-query', () => '');
  const typeCounts = useState<Record<string, number>>('ws-type-counts', () => ({ All: 5000 }));
  const loadingData = useState<boolean>('ws-loading-data', () => false);

  // File Explorer State
  const currentFolderId = useState<string | null>('ws-folder-id', () => null);
  const fsItems = useState<FsNodeRecord[]>('ws-fs-items', () => []);
  const fsBreadcrumbs = useState<{ id: string; name: string }[]>('ws-fs-breadcrumbs', () => []);
  const loadingFs = useState<boolean>('ws-loading-fs', () => false);

  // Global Graph State
  const globalNodes = useState<GraphNode[]>('ws-global-nodes', () => []);
  const globalEdges = useState<GraphEdge[]>('ws-global-edges', () => []);
  const loadingGraph = useState<boolean>('ws-loading-graph', () => false);

  // Full-Text Search State
  const searchResults = useState<{ entity: Entity; score: number; matches: { field: EntityField; snippet: string }[] }[]>(
    'ws-search-results',
    () => []
  );
  const searchTotal = useState<number>('ws-search-total', () => 0);
  const searchSortBy = useState<'relevance' | 'name' | 'fields'>('ws-search-sort', () => 'relevance');
  const loadingSearch = useState<boolean>('ws-loading-search', () => false);

  // Git Merge Requests State
  const mergeRequests = useState<MergeRequest[]>('ws-merge-requests', () => []);
  const mrDrawerOpen = useState<boolean>('ws-mr-drawer-open', () => false);
  const createMrDialogOpen = useState<boolean>('ws-create-mr-dialog-open', () => false);
  const mrTargetEntity = useState<Entity | null>('ws-mr-target-entity', () => null);
  const mrTargetFile = useState<FsNodeRecord | null>('ws-mr-target-file', () => null);
  const loadingMr = useState<boolean>('ws-loading-mr', () => false);

  const currentUser = computed<DataAuthor>(() => {
    return (
      authors.value.find(a => a.id === currentUserId.value) || {
        id: 'usr-sarah',
        name: 'Sarah Chen',
        handle: '@sarah.chen',
        email: 'sarah.chen@graphcorp.io',
        role: 'Owner',
        avatarColor: '#00C9A7',
      }
    );
  });

  const activeDataset = computed<DatasetCollection | undefined>(() => {
    return datasets.value.find(d => d.id === activeDatasetId.value);
  });

  const openMergeRequests = computed(() =>
    mergeRequests.value.filter(m => m.status === 'open')
  );

  const pendingMyApprovalCount = computed(() =>
    openMergeRequests.value.filter(m => m.dataOwner.id === currentUser.value.id).length
  );

  async function initWorkspace() {
    const [catalogRes, mrs] = await Promise.all([
      api.fetchCatalog(),
      api.fetchMergeRequests('all'),
    ]);
    datasets.value = catalogRes.datasets;
    authors.value = catalogRes.authors;
    mergeRequests.value = mrs;

    await Promise.all([
      loadEntitiesPage(),
      loadFsFolder(currentFolderId.value),
      loadGlobalGraph(),
      loadSearchResults(),
    ]);
  }

  async function loadEntitiesPage() {
    loadingData.value = true;
    try {
      const res = await api.fetchEntitiesPage({
        page: page.value,
        pageSize: pageSize.value,
        type: typeFilter.value,
        search: searchQuery.value,
        authorId: activeAuthorFilter.value,
      });
      rows.value = res.items;
      totalRows.value = res.total;
      totalPages.value = res.totalPages;
      page.value = res.page;
      if (res.typeCounts) {
        typeCounts.value = res.typeCounts;
      }
    } finally {
      loadingData.value = false;
    }
  }

  async function selectDataset(dataset: DatasetCollection) {
    activeDatasetId.value = dataset.id;
    typeFilter.value = dataset.entityTypeFilter;
    page.value = 1;

    if (dataset.category === 'FileSystem') {
      viewMode.value = 'files';
      await loadFsFolder(dataset.folderId ?? null);
    } else {
      if (viewMode.value === 'files') {
        viewMode.value = dataset.defaultView;
      }
      await Promise.all([loadEntitiesPage(), loadSearchResults()]);
    }
  }

  async function inspectEntityById(entityId: string, fieldKey?: string) {
    activeFieldKey.value = fieldKey;
    const detail = await api.fetchEntityDetail(entityId);
    inspectedEntity.value = detail.entity;
    inspectedSubgraph.value = detail.subgraph;
    inspectedFile.value = null;
    rightToolOpen.value = true;

    // Push to navigation breadcrumb history
    const exists = navigationHistory.value.findIndex(h => h.id === detail.entity.id);
    if (exists !== -1) {
      navigationHistory.value.splice(exists, 1);
    }
    navigationHistory.value.unshift({
      id: detail.entity.id,
      label: detail.entity.label,
      type: detail.entity.type,
    });
    if (navigationHistory.value.length > 12) {
      navigationHistory.value.pop();
    }
  }

  async function previewEntityById(entityId: string) {
    const detail = await api.fetchEntityDetail(entityId);
    previewEntity.value = detail.entity;
    rightToolTab.value = 'preview';
    rightToolOpen.value = true;
  }

  async function inspectFileNode(file: FsNodeRecord) {
    inspectedFile.value = { ...file };
    inspectedEntity.value = null;
    inspectedSubgraph.value = null;
    rightToolOpen.value = true;
    rightToolTab.value = 'inspector';
  }

  function closeInspector() {
    rightToolOpen.value = false;
  }

  async function loadFsFolder(folderId: string | null) {
    loadingFs.value = true;
    currentFolderId.value = folderId;
    try {
      const [children, crumbs] = await Promise.all([
        api.fetchFsChildren(folderId),
        api.fetchFsBreadcrumbs(folderId),
      ]);
      fsItems.value = children;
      fsBreadcrumbs.value = crumbs;
    } finally {
      loadingFs.value = false;
    }
  }

  async function createFsItem(payload: {
    name: string;
    type: FsNodeType;
    content_json?: string;
  }) {
    const created = await api.createFsNode({
      name: payload.name,
      type: payload.type,
      content_json: payload.content_json,
      parentId: currentFolderId.value,
      authorId: currentUser.value.id,
    });
    await loadFsFolder(currentFolderId.value);
    if (created.type !== 2) {
      await inspectFileNode(created);
    }
    return created;
  }

  async function renameFsItem(id: string, newName: string) {
    await api.renameFsNode(id, newName);
    await loadFsFolder(currentFolderId.value);
    if (inspectedFile.value?.id === id) {
      inspectedFile.value.name = newName;
    }
  }

  async function moveFsItem(id: string, targetParentId: string | null) {
    await api.moveFsNode(id, targetParentId);
    await loadFsFolder(currentFolderId.value);
  }

  async function deleteFsItem(id: string) {
    await api.deleteFsNode(id);
    if (inspectedFile.value?.id === id) {
      inspectedFile.value = null;
    }
    await loadFsFolder(currentFolderId.value);
  }

  async function saveFsItemContent(id: string, content_json: string) {
    const updated = await api.saveFsNodeContent(id, content_json);
    await loadFsFolder(currentFolderId.value);
    if (inspectedFile.value?.id === id) {
      inspectedFile.value = { ...updated };
    }
  }

  async function loadGlobalGraph() {
    loadingGraph.value = true;
    try {
      const res = await api.fetchGlobalGraph();
      globalNodes.value = res.nodes;
      globalEdges.value = res.edges;
    } finally {
      loadingGraph.value = false;
    }
  }

  async function loadSearchResults() {
    loadingSearch.value = true;
    try {
      const res = await api.searchGraph({
        q: searchQuery.value,
        type: typeFilter.value,
        sortBy: searchSortBy.value,
        page: 1,
        pageSize: 30,
      });
      searchResults.value = res.items;
      searchTotal.value = res.total;
    } finally {
      loadingSearch.value = false;
    }
  }

  function openProposeMrForEntity(entity: Entity) {
    mrTargetEntity.value = entity;
    mrTargetFile.value = null;
    createMrDialogOpen.value = true;
  }

  function openProposeMrForFile(file: FsNodeRecord) {
    mrTargetFile.value = file;
    mrTargetEntity.value = null;
    createMrDialogOpen.value = true;
  }

  async function submitMergeRequest(payload: {
    title: string;
    description: string;
    sourceBranch?: string;
    targetType: 'entity' | 'fsNode';
    targetId: string;
    changes: MergeRequestFieldChange[];
    proposedJsonContent?: string;
  }) {
    loadingMr.value = true;
    try {
      const created = await api.createMergeRequest({
        ...payload,
        authorId: currentUser.value.id,
      });
      mergeRequests.value = await api.fetchMergeRequests('all');
      createMrDialogOpen.value = false;
      mrDrawerOpen.value = true;
      return created;
    } finally {
      loadingMr.value = false;
    }
  }

  async function reviewMergeRequest(params: {
    mrId: string;
    action: 'approve' | 'reject';
    comment?: string;
  }) {
    loadingMr.value = true;
    try {
      const updated = await api.reviewMergeRequest({
        mrId: params.mrId,
        action: params.action,
        reviewerId: currentUser.value.id,
        comment: params.comment,
      });
      mergeRequests.value = await api.fetchMergeRequests('all');

      await Promise.all([
        loadEntitiesPage(),
        loadGlobalGraph(),
        loadSearchResults(),
        loadFsFolder(currentFolderId.value),
      ]);

      if (inspectedEntity.value && inspectedEntity.value.id === updated.targetId) {
        await inspectEntityById(updated.targetId, activeFieldKey.value);
      }

      return updated;
    } finally {
      loadingMr.value = false;
    }
  }

  return {
    datasets,
    authors,
    currentUserId,
    currentUser,
    activeDatasetId,
    activeDataset,
    activeAuthorFilter,
    viewMode,
    leftToolOpen,
    rightToolOpen,
    rightToolTab,
    inspectedEntity,
    inspectedSubgraph,
    inspectedFile,
    activeFieldKey,
    previewEntity,
    navigationHistory,
    rows,
    totalRows,
    page,
    pageSize,
    totalPages,
    typeFilter,
    searchQuery,
    typeCounts,
    loadingData,
    currentFolderId,
    fsItems,
    fsBreadcrumbs,
    loadingFs,
    globalNodes,
    globalEdges,
    loadingGraph,
    searchResults,
    searchTotal,
    searchSortBy,
    loadingSearch,
    mergeRequests,
    openMergeRequests,
    pendingMyApprovalCount,
    mrDrawerOpen,
    createMrDialogOpen,
    mrTargetEntity,
    mrTargetFile,
    loadingMr,

    initWorkspace,
    loadEntitiesPage,
    selectDataset,
    inspectEntityById,
    previewEntityById,
    inspectFileNode,
    closeInspector,
    loadFsFolder,
    createFsItem,
    renameFsItem,
    moveFsItem,
    deleteFsItem,
    saveFsItemContent,
    loadGlobalGraph,
    loadSearchResults,
    openProposeMrForEntity,
    openProposeMrForFile,
    submitMergeRequest,
    reviewMergeRequest,
  };
}