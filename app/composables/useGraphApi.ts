import type {
  DataAuthor,
  DatasetCollection,
  Entity,
  EntityField,
  FsNodeRecord,
  FsNodeType,
  GraphEdge,
  GraphNode,
  LocalSubgraph,
  MergeRequest,
  MergeRequestFieldChange,
  PaginatedResult,
  TableRow,
} from '~/razomy/abstractions/graph';

export function useGraphApi() {
  async function fetchCatalog(): Promise<{
    datasets: DatasetCollection[];
    authors: DataAuthor[];
  }> {
    return await $fetch<{ datasets: DatasetCollection[]; authors: DataAuthor[] }>('/api/datasets');
  }

  async function fetchEntitiesPage(params: {
    page: number;
    pageSize: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    authorId?: string;
  }): Promise<PaginatedResult<TableRow>> {
    return await $fetch<PaginatedResult<TableRow>>('/api/entities', {
      query: params,
    });
  }

  async function fetchEntityDetail(id: string): Promise<{ entity: Entity; subgraph: LocalSubgraph }> {
    return await $fetch<{ entity: Entity; subgraph: LocalSubgraph }>(`/api/entities/${id}`);
  }

  async function fetchGlobalGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    return await $fetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/api/graph/nodes');
  }

  async function fetchSubgraph(id: string, width = 420, height = 260): Promise<LocalSubgraph> {
    return await $fetch<LocalSubgraph>('/api/graph/subgraph', {
      query: { id, width, height },
    });
  }

  async function searchGraph(params: {
    q: string;
    type?: string;
    sortBy?: 'relevance' | 'name' | 'fields';
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: { entity: Entity; score: number; matches: { field: EntityField; snippet: string }[] }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    types: string[];
  }> {
    return await $fetch('/api/search', { query: params });
  }

  async function fetchFsPaginated(params: {
    page: number;
    pageSize: number;
    search?: string;
    type?: string | number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<PaginatedResult<FsNodeRecord>> {
    return await $fetch<PaginatedResult<FsNodeRecord>>('/api/fs/list', {
      query: params,
    });
  }

  async function fetchFsChildren(folderId: string | null): Promise<FsNodeRecord[]> {
    return await $fetch<FsNodeRecord[]>('/api/fs/children', {
      query: folderId ? { folderId } : {},
    });
  }

  async function fetchFsBreadcrumbs(folderId: string | null): Promise<{ id: string; name: string }[]> {
    if (!folderId) return [];
    return await $fetch<{ id: string; name: string }[]>('/api/fs/breadcrumbs', {
      query: { id: folderId },
    });
  }

  async function createFsNode(payload: {
    name: string;
    type: FsNodeType;
    content_json?: string;
    parentId?: string | null;
    authorId?: string;
  }): Promise<FsNodeRecord> {
    return await $fetch<FsNodeRecord>('/api/fs/create', {
      method: 'POST',
      body: payload,
    });
  }

  async function renameFsNode(id: string, newName: string): Promise<FsNodeRecord> {
    return await $fetch<FsNodeRecord>('/api/fs/rename', {
      method: 'PUT',
      body: { id, newName },
    });
  }

  async function moveFsNode(nodeId: string, newParentId: string | null): Promise<FsNodeRecord> {
    return await $fetch<FsNodeRecord>('/api/fs/move', {
      method: 'POST',
      body: { nodeId, newParentId },
    });
  }

  async function deleteFsNode(id: string): Promise<boolean> {
    return await $fetch<boolean>('/api/fs/delete', {
      method: 'DELETE',
      body: { id },
    });
  }

  async function saveFsNodeContent(id: string, content_json: string): Promise<FsNodeRecord> {
    return await $fetch<FsNodeRecord>('/api/fs/save', {
      method: 'PUT',
      body: { id, content_json },
    });
  }

  async function fetchMergeRequests(status = 'all'): Promise<MergeRequest[]> {
    return await $fetch<MergeRequest[]>('/api/mr', {
      query: { status },
    });
  }

  async function createMergeRequest(payload: {
    title: string;
    description: string;
    sourceBranch?: string;
    targetType: 'entity' | 'fsNode';
    targetId: string;
    authorId: string;
    changes: MergeRequestFieldChange[];
    proposedJsonContent?: string;
  }): Promise<MergeRequest> {
    return await $fetch<MergeRequest>('/api/mr/create', {
      method: 'POST',
      body: payload,
    });
  }

  async function reviewMergeRequest(payload: {
    mrId: string;
    action: 'approve' | 'reject';
    reviewerId: string;
    comment?: string;
  }): Promise<MergeRequest> {
    return await $fetch<MergeRequest>('/api/mr/review', {
      method: 'POST',
      body: payload,
    });
  }

  return {
    fetchCatalog,
    fetchEntitiesPage,
    fetchEntityDetail,
    fetchGlobalGraph,
    fetchSubgraph,
    searchGraph,
    fetchFsPaginated,
    fetchFsChildren,
    fetchFsBreadcrumbs,
    createFsNode,
    renameFsNode,
    moveFsNode,
    deleteFsNode,
    saveFsNodeContent,
    fetchMergeRequests,
    createMergeRequest,
    reviewMergeRequest,
  };
}
