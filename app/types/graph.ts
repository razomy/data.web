export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'url'
  | 'image'
  | 'date'
  | 'email'
  | 'json'
  | 'array'
  | 'geo';

export type DataViewMode = 'table' | 'cards' | 'files' | 'graph' | 'text' | 'search';

export interface DataAuthor {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: 'Owner' | 'Maintainer' | 'Contributor';
  avatarColor: string;
}

export interface EntityField {
  key: string;
  value: string | number | boolean | string[];
  type: FieldType;
}

export interface Entity {
  id: string;
  label: string;
  type: string;
  color: string;
  description: string;
  imageUrl?: string;
  fields: EntityField[];
  connectedTo: string[];
  author: DataAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color: string;
  x: number;
  y: number;
  size: number;
  entity: Entity;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface LocalSubgraph {
  centerNode: GraphNode;
  neighborNodes: GraphNode[];
  edges: GraphEdge[];
  allNodes: GraphNode[];
}

export interface TableRow {
  id: string;
  index: number;
  entityId: string;
  label: string;
  type: string;
  color: string;
  fields: EntityField[];
  connectedCount: number;
  fieldCount: number;
  author: DataAuthor;
  updatedAt: string;
  imageUrl?: string;
}

export enum FsNodeType {
  FileBinary = 0,
  FileJson = 1,
  Directory = 2,
}

export interface FsNodeRecord {
  id: string;
  name: string;
  type: FsNodeType;
  content_json: string;
  content_binary?: string | null;
  parentId: string | null;
  ancestors: string[];
  author: DataAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  typeCounts?: Record<string, number>;
}

export interface DatasetCollection {
  id: string;
  name: string;
  category: 'Relational' | 'FileSystem' | 'KnowledgeGraph' | 'TextCorpus';
  entityTypeFilter: string;
  folderId?: string | null;
  icon: string;
  color: string;
  count: number;
  owner: DataAuthor;
  defaultView: DataViewMode;
  description: string;
}

export type MergeRequestStatus = 'open' | 'merged' | 'rejected';

export interface MergeRequestFieldChange {
  fieldKey: string;
  oldValue: string;
  newValue: string;
  fieldType: FieldType;
}

export interface MergeRequest {
  id: string;
  mrNumber: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  targetType: 'entity' | 'fsNode';
  targetId: string;
  targetLabel: string;
  entityType: string;
  author: DataAuthor;
  dataOwner: DataAuthor;
  status: MergeRequestStatus;
  changes: MergeRequestFieldChange[];
  proposedEntityFields?: EntityField[];
  proposedJsonContent?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: DataAuthor;
  reviewComment?: string;
}