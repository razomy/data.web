import { FsNodeType } from '~/razomy/abstractions/graph.ts';
import type {
  DataAuthor,
  DatasetCollection,
  Entity,
  EntityField,
  FsNodeRecord,
  GraphEdge,
  GraphNode,
  MergeRequest,
  MergeRequestFieldChange,
  PaginatedResult,
  TableRow,
} from '~/razomy/abstractions/graph.ts';
import { AUTHORS, entities as seedEntities, graphEdges as seedEdges, graphNodes as seedGraphNodes } from '~/data/mockData.ts';
import { generateRows } from '~/data/generateRows.ts';
import { registerEntity, resolveLocalSubgraph, rowToEntity } from '~/data/graphResolver.ts';

export interface FindManyQuery {
  where?: {
    parentId?: string | null;
    type?: string | number;
    search?: string;
    idIn?: string[];
    ancestorsHas?: string;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  skip?: number;
  take?: number;
}

class MockOrmClient {
  private fsNodesStore: Map<string, FsNodeRecord> = new Map();
  private entitiesStore: Map<string, Entity> = new Map();
  private rowsStore: TableRow[] = [];
  private graphNodesStore: GraphNode[] = [];
  private graphEdgesStore: GraphEdge[] = [];
  private mergeRequestsStore: Map<string, MergeRequest> = new Map();
  private idCounter = 1000;
  private mrCounter = 100;

  constructor() {
    this.seed();
  }

  private nextId(prefix = 'fs'): string {
    this.idCounter += 1;
    return `${prefix}-${this.idCounter}`;
  }

  private seed() {
    // 1. Seed Core Entities
    for (const ent of seedEntities) {
      this.entitiesStore.set(ent.id, {
        ...ent,
        fields: ent.fields.map(f => ({ ...f })),
      });
    }

    // 2. Seed 5,000 Generated Table Rows
    this.rowsStore = generateRows(5000);
    // Sync first 7 rows with core entities e1..e7 so table and core graph match seamlessly
    seedEntities.forEach((ent, idx) => {
      if (this.rowsStore[idx]) {
        this.rowsStore[idx] = {
          id: `row-${idx}`,
          index: idx,
          entityId: ent.id,
          label: ent.label,
          type: ent.type,
          color: ent.color,
          fields: ent.fields.map(f => ({ ...f })),
          connectedCount: ent.connectedTo.length,
          fieldCount: ent.fields.length,
          author: ent.author,
          updatedAt: ent.updatedAt.slice(0, 10),
          imageUrl: ent.imageUrl,
        };
      }
    });

    for (const r of this.rowsStore.slice(0, 80)) {
      const ent = rowToEntity(r);
      if (!this.entitiesStore.has(ent.id)) {
        this.entitiesStore.set(ent.id, ent);
      }
    }

    // 3. Seed Global Graph Nodes & Edges
    this.graphNodesStore = seedGraphNodes.map(n => ({ ...n }));
    this.graphEdgesStore = seedEdges.map(e => ({ ...e }));

    // 4. Seed Virtual FileSystem (FsNodes) with authors
    const now = new Date().toISOString();
    const rootFolders: FsNodeRecord[] = [
      {
        id: 'dir-schemas',
        name: 'schemas',
        type: FsNodeType.Directory,
        content_json: '',
        parentId: null,
        ancestors: [],
        author: AUTHORS[0]!,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: now,
      },
      {
        id: 'dir-entities',
        name: 'entities',
        type: FsNodeType.Directory,
        content_json: '',
        parentId: null,
        ancestors: [],
        author: AUTHORS[1]!,
        createdAt: '2026-01-12T11:30:00Z',
        updatedAt: now,
      },
      {
        id: 'dir-pipelines',
        name: 'pipelines',
        type: FsNodeType.Directory,
        content_json: '',
        parentId: null,
        ancestors: [],
        author: AUTHORS[3]!,
        createdAt: '2026-02-01T09:15:00Z',
        updatedAt: now,
      },
      {
        id: 'dir-queries',
        name: 'cypher_queries',
        type: FsNodeType.Directory,
        content_json: '',
        parentId: null,
        ancestors: [],
        author: AUTHORS[2]!,
        createdAt: '2026-02-14T16:20:00Z',
        updatedAt: now,
      },
    ];

    for (const folder of rootFolders) {
      this.fsNodesStore.set(folder.id, folder);
    }

    const rootFiles: FsNodeRecord[] = [
      {
        id: 'file-graph-config',
        name: 'graphos.config.json',
        type: FsNodeType.FileJson,
        content_json: JSON.stringify(
          {
            cluster: 'us-west-graph-01',
            engine: 'GraphOS v4.2.1',
            replicationFactor: 3,
            protocols: ['bolt+s', 'https', 'grpc'],
            vectorIndex: { enabled: true, dimensions: 1536, metric: 'cosine' },
          },
          null,
          2
        ),
        parentId: null,
        ancestors: [],
        author: AUTHORS[0]!,
        createdAt: '2026-03-01T12:00:00Z',
        updatedAt: now,
      },
      {
        id: 'file-manifest',
        name: 'registry.manifest.json',
        type: FsNodeType.FileJson,
        content_json: JSON.stringify(
          {
            name: 'razomy-knowledge-graph',
            version: '4.2.0',
            totalEntities: 5000,
            coreNodes: seedEntities.length,
            coreEdges: seedEdges.length,
          },
          null,
          2
        ),
        parentId: null,
        ancestors: [],
        author: AUTHORS[3]!,
        createdAt: '2026-03-05T15:40:00Z',
        updatedAt: now,
      },
    ];

    for (const file of rootFiles) {
      this.fsNodesStore.set(file.id, file);
    }

    for (const ent of seedEntities) {
      const id = `file-entity-${ent.id}`;
      this.fsNodesStore.set(id, {
        id,
        name: `${ent.id}_${ent.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`,
        type: FsNodeType.FileJson,
        content_json: JSON.stringify(ent, null, 2),
        parentId: 'dir-entities',
        ancestors: ['dir-entities'],
        author: ent.author,
        createdAt: ent.createdAt,
        updatedAt: ent.updatedAt,
      });
    }

    const schemaTypes = ['Person', 'Organization', 'Product', 'Event', 'Document', 'Concept'];
    schemaTypes.forEach((t, idx) => {
      const id = `file-schema-${t.toLowerCase()}`;
      this.fsNodesStore.set(id, {
        id,
        name: `${t.toLowerCase()}.schema.json`,
        type: FsNodeType.FileJson,
        content_json: JSON.stringify(
          {
            $schema: 'https://graphcorp.io/schemas/v4.json',
            entityType: t,
            indexed: true,
            primaryKey: 'id',
            partitionKey: `shard_${idx + 1}`,
          },
          null,
          2
        ),
        parentId: 'dir-schemas',
        ancestors: ['dir-schemas'],
        author: AUTHORS[idx % AUTHORS.length]!,
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: now,
      });
    });

    for (let i = 1; i <= 48; i++) {
      const isDir = i % 9 === 0;
      const isBin = !isDir && i % 5 === 0;
      const parentId = i % 3 === 0 ? 'dir-pipelines' : i % 2 === 0 ? 'dir-queries' : null;
      const id = `node-${String(100 + i)}`;
      const name = isDir
        ? `partition_batch_${String(i).padStart(2, '0')}`
        : isBin
        ? `snapshot_${202600 + i}.bin`
        : `subgraph_node_${String(i).padStart(3, '0')}.json`;

      this.fsNodesStore.set(id, {
        id,
        name,
        type: isDir ? FsNodeType.Directory : isBin ? FsNodeType.FileBinary : FsNodeType.FileJson,
        content_json: isDir
          ? ''
          : JSON.stringify(
              {
                batchId: i,
                nodeCount: 120 * i,
                checksum: `sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a${String(i).padStart(2, '0')}`,
                synced: true,
              },
              null,
              2
            ),
        parentId,
        ancestors: parentId ? [parentId] : [],
        author: AUTHORS[i % AUTHORS.length]!,
        createdAt: `2026-${String(1 + (i % 9)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}T10:20:00Z`,
        updatedAt: now,
      });
    }

    // 5. Seed realistic Git-like Merge Requests for data changes
    const seedMrs: MergeRequest[] = [
      {
        id: 'mr-101',
        mrNumber: 101,
        title: 'feat(e1): Promote Sarah Chen to Principal Graph Architect & update compensation',
        description: 'Annual performance review update for Sarah Chen (e1). Updates role, salary band, and performance score.',
        sourceBranch: 'feat/sarah-principal-promo',
        targetBranch: 'main',
        targetType: 'entity',
        targetId: 'e1',
        targetLabel: 'Sarah Chen',
        entityType: 'Person',
        author: AUTHORS[1]!, // Marcus proposed
        dataOwner: AUTHORS[0]!, // Sarah owns e1
        status: 'open',
        changes: [
          { fieldKey: 'role', oldValue: 'Senior Engineer', newValue: 'Principal Graph Architect', fieldType: 'string' },
          { fieldKey: 'salary', oldValue: '185000', newValue: '225000', fieldType: 'number' },
          { fieldKey: 'performanceScore', oldValue: '9.4', newValue: '9.9', fieldType: 'number' },
        ],
        createdAt: '2026-09-19T10:15:00Z',
        updatedAt: '2026-09-19T10:15:00Z',
      },
      {
        id: 'mr-102',
        mrNumber: 102,
        title: 'chore(e4): Bump GraphOS Platform to v4.3.0-rc1 and lower avgQueryMs',
        description: 'Release candidate metrics from zero-copy Rust traversal engine benchmark.',
        sourceBranch: 'release/graphos-v4.3',
        targetBranch: 'main',
        targetType: 'entity',
        targetId: 'e4',
        targetLabel: 'GraphOS Platform',
        entityType: 'Product',
        author: AUTHORS[3]!, // Yevhenii proposed
        dataOwner: AUTHORS[1]!, // Marcus owns e4
        status: 'open',
        changes: [
          { fieldKey: 'version', oldValue: '4.2.1', newValue: '4.3.0-rc1', fieldType: 'string' },
          { fieldKey: 'avgQueryMs', oldValue: '4.2', newValue: '1.8', fieldType: 'number' },
          { fieldKey: 'activeUsers', oldValue: '12847', newValue: '15420', fieldType: 'number' },
        ],
        createdAt: '2026-09-19T14:40:00Z',
        updatedAt: '2026-09-19T14:40:00Z',
      },
      {
        id: 'mr-103',
        mrNumber: 103,
        title: 'docs(e6): Transition W3C KGIS v2 status from Working Draft to Candidate Recommendation',
        description: 'Approved by W3C Working Group vote on Sept 18.',
        sourceBranch: 'docs/w3c-cr-status',
        targetBranch: 'main',
        targetType: 'entity',
        targetId: 'e6',
        targetLabel: 'Knowledge Graph Standard',
        entityType: 'Document',
        author: AUTHORS[0]!,
        dataOwner: AUTHORS[2]!, // Leilani owns e6
        status: 'open',
        changes: [
          { fieldKey: 'status', oldValue: 'Working Draft', newValue: 'Candidate Recommendation', fieldType: 'string' },
          { fieldKey: 'version', oldValue: '2.0.3', newValue: '2.1.0-CR', fieldType: 'string' },
        ],
        createdAt: '2026-09-18T17:00:00Z',
        updatedAt: '2026-09-18T17:00:00Z',
      },
      {
        id: 'mr-100',
        mrNumber: 100,
        title: 'fix(e3): Update GraphCorp headcount & Series C valuation metrics',
        description: 'Q3 audited financials sync.',
        sourceBranch: 'sync/q3-headcount',
        targetBranch: 'main',
        targetType: 'entity',
        targetId: 'e3',
        targetLabel: 'GraphCorp Inc.',
        entityType: 'Organization',
        author: AUTHORS[1]!,
        dataOwner: AUTHORS[0]!,
        status: 'merged',
        reviewedBy: AUTHORS[0]!,
        reviewComment: 'Verified against Q3 ledger. Merging into main.',
        changes: [
          { fieldKey: 'employees', oldValue: '410', newValue: '423', fieldType: 'number' },
        ],
        createdAt: '2026-09-14T09:00:00Z',
        updatedAt: '2026-09-15T11:20:00Z',
      },
    ];

    this.mrCounter = 103;
    for (const mr of seedMrs) {
      this.mergeRequestsStore.set(mr.id, mr);
    }
  }

  // ============================================================================
  // DATASETS & AUTHORS CATALOG REPOSITORY
  // ============================================================================
  public catalog = {
    getAuthors: async (): Promise<DataAuthor[]> => {
      return AUTHORS;
    },

    getDatasets: async (): Promise<DatasetCollection[]> => {
      const typeCounts: Record<string, number> = { All: this.rowsStore.length };
      for (const r of this.rowsStore) {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      }

      return [
        {
          id: 'ds-all',
          name: 'All Database Records',
          category: 'Relational',
          entityTypeFilter: 'All',
          icon: 'mdi-database-outline',
          color: '#00C9A7',
          count: this.rowsStore.length,
          owner: AUTHORS[0]!,
          defaultView: 'table',
          description: 'Unified multi-model registry containing all 5,000+ relational, graph, and document entities.',
        },
        {
          id: 'ds-person',
          name: 'People & Contributors',
          category: 'Relational',
          entityTypeFilter: 'Person',
          icon: 'mdi-account-group-outline',
          color: '#00C9A7',
          count: typeCounts['Person'] || 834,
          owner: AUTHORS[0]!,
          defaultView: 'table',
          description: 'Engineers, researchers, and organization members with roles, skills, and compensation.',
        },
        {
          id: 'ds-org',
          name: 'Organizations & Enterprises',
          category: 'Relational',
          entityTypeFilter: 'Organization',
          icon: 'mdi-domain',
          color: '#7B61FF',
          count: typeCounts['Organization'] || 833,
          owner: AUTHORS[1]!,
          defaultView: 'cards',
          description: 'Enterprise companies, research labs, investors, and partners.',
        },
        {
          id: 'ds-product',
          name: 'Products & Platforms',
          category: 'Relational',
          entityTypeFilter: 'Product',
          icon: 'mdi-cube-outline',
          color: '#FF6B35',
          count: typeCounts['Product'] || 833,
          owner: AUTHORS[1]!,
          defaultView: 'table',
          description: 'Software platforms, database engines, SLAs, and release metrics.',
        },
        {
          id: 'ds-document',
          name: 'Text & RFC Specifications',
          category: 'TextCorpus',
          entityTypeFilter: 'Document',
          icon: 'mdi-file-document-Multiple-outline',
          color: '#4A9EFF',
          count: typeCounts['Document'] || 833,
          owner: AUTHORS[2]!,
          defaultView: 'text',
          description: 'Technical specifications, W3C standards, whitepapers, and full-text documents.',
        },
        {
          id: 'ds-concept',
          name: 'Ontology & Graph Concepts',
          category: 'KnowledgeGraph',
          entityTypeFilter: 'Concept',
          icon: 'mdi-Brain',
          color: '#A8FF78',
          count: typeCounts['Concept'] || 833,
          owner: AUTHORS[3]!,
          defaultView: 'graph',
          description: 'Formal mathematical graph models, algorithms, and ISO query concepts.',
        },
        {
          id: 'ds-event',
          name: 'Conferences & Events',
          category: 'Relational',
          entityTypeFilter: 'Event',
          icon: 'mdi-calendar-star',
          color: '#E05A87',
          count: typeCounts['Event'] || 834,
          owner: AUTHORS[2]!,
          defaultView: 'cards',
          description: 'Summits, symposiums, workshops, and keynote schedules.',
        },
        {
          id: 'ds-fs-root',
          name: 'Virtual File System (ORM)',
          category: 'FileSystem',
          entityTypeFilter: 'All',
          folderId: null,
          icon: 'mdi-folder-network-outline',
          color: '#F0C040',
          count: this.fsNodesStore.size,
          owner: AUTHORS[3]!,
          defaultView: 'files',
          description: 'Hierarchical JSON schemas, entity snapshots, and binary partitions.',
        },
      ];
    },
  };

  // ============================================================================
  // GIT-LIKE MERGE REQUESTS ORM REPOSITORY
  // ============================================================================
  public mergeRequest = {
    list: async (status?: string): Promise<MergeRequest[]> => {
      let all = Array.from(this.mergeRequestsStore.values());
      if (status && status !== 'all') {
        all = all.filter(mr => mr.status === status);
      }
      return all.sort((a, b) => b.mrNumber - a.mrNumber);
    },

    create: async (payload: {
      title: string;
      description: string;
      sourceBranch?: string;
      targetType: 'entity' | 'fsNode';
      targetId: string;
      authorId: string;
      changes: MergeRequestFieldChange[];
      proposedJsonContent?: string;
    }): Promise<MergeRequest> => {
      const author = AUTHORS.find(a => a.id === payload.authorId) || AUTHORS[0]!;
      let targetLabel = payload.targetId;
      let entityType = 'Record';
      let dataOwner: DataAuthor = AUTHORS[0]!;

      if (payload.targetType === 'entity') {
        const ent = await this.entityRow.findEntityById(payload.targetId);
        if (!ent) {
          throw new Error(`Target entity "${payload.targetId}" not found`);
        }
        targetLabel = ent.label;
        entityType = ent.type;
        dataOwner = ent.author || AUTHORS[0]!;
      } else {
        const node = await this.fsNode.findUnique(payload.targetId);
        if (!node) {
          throw new Error(`Target file "${payload.targetId}" not found`);
        }
        targetLabel = node.name;
        entityType = 'FileJson';
        dataOwner = node.author || AUTHORS[0]!;
      }

      this.mrCounter += 1;
      const now = new Date().toISOString();
      const mr: MergeRequest = {
        id: `mr-${this.mrCounter}`,
        mrNumber: this.mrCounter,
        title: payload.title.trim() || `Update ${targetLabel}`,
        description: payload.description.trim() || `Proposed data modifications for ${targetLabel}.`,
        sourceBranch:
          payload.sourceBranch?.trim() ||
          `patch/${author.handle.replace('@', '')}-${this.mrCounter}`,
        targetBranch: 'main',
        targetType: payload.targetType,
        targetId: payload.targetId,
        targetLabel,
        entityType,
        author,
        dataOwner,
        status: 'open',
        changes: payload.changes,
        proposedJsonContent: payload.proposedJsonContent,
        createdAt: now,
        updatedAt: now,
      };

      this.mergeRequestsStore.set(mr.id, mr);
      return mr;
    },

    review: async (params: {
      mrId: string;
      action: 'approve' | 'reject';
      reviewerId: string;
      comment?: string;
    }): Promise<MergeRequest> => {
      const mr = this.mergeRequestsStore.get(params.mrId);
      if (!mr) {
        throw new Error(`Merge Request "${params.mrId}" not found`);
      }
      if (mr.status !== 'open') {
        throw new Error(`Merge Request !${mr.mrNumber} is already ${mr.status}`);
      }

      const reviewer = AUTHORS.find(a => a.id === params.reviewerId) || mr.dataOwner;
      const now = new Date().toISOString();

      if (params.action === 'approve') {
        // Apply changes to the underlying database entity or file node
        if (mr.targetType === 'entity') {
          const ent = await this.entityRow.findEntityById(mr.targetId);
          if (ent) {
            const updatedFields: EntityField[] = ent.fields.map(f => {
              const change = mr.changes.find(c => c.fieldKey === f.key);
              if (!change) return f;

              let parsedVal: string | number | boolean | string[] = change.newValue;
              if (f.type === 'number') {
                const n = Number(change.newValue);
                parsedVal = Number.isNaN(n) ? 0 : n;
              } else if (f.type === 'boolean') {
                parsedVal = change.newValue === 'true' || change.newValue === '1';
              } else if (f.type === 'array') {
                parsedVal = change.newValue
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean);
              }
              return { ...f, value: parsedVal };
            });

            // Also add any brand-new fields proposed in the MR
            for (const change of mr.changes) {
              if (!updatedFields.some(f => f.key === change.fieldKey)) {
                updatedFields.push({
                  key: change.fieldKey,
                  value: change.newValue,
                  type: change.fieldType || 'string',
                });
              }
            }

            ent.fields = updatedFields;
            ent.updatedAt = now;
            this.entitiesStore.set(ent.id, ent);
            registerEntity(ent);

            // Sync with rowsStore
            const rowIdx = this.rowsStore.findIndex(r => r.entityId === ent.id);
            if (rowIdx !== -1) {
              this.rowsStore[rowIdx] = {
                ...this.rowsStore[rowIdx]!,
                fields: updatedFields,
                fieldCount: updatedFields.length,
                updatedAt: now.slice(0, 10),
              };
            }

            // Sync with global graph nodes
            const gIdx = this.graphNodesStore.findIndex(n => n.id === ent.id);
            if (gIdx !== -1) {
              this.graphNodesStore[gIdx] = {
                ...this.graphNodesStore[gIdx]!,
                entity: ent,
              };
            }
          }
        } else if (mr.targetType === 'fsNode') {
          const node = await this.fsNode.findUnique(mr.targetId);
          if (node) {
            const nextContent =
              mr.proposedJsonContent ||
              (mr.changes[0] ? mr.changes[0].newValue : node.content_json);
            await this.fsNode.update(node.id, { content_json: nextContent });
          }
        }

        mr.status = 'merged';
      } else {
        mr.status = 'rejected';
      }

      mr.reviewedBy = reviewer;
      mr.reviewComment =
        params.comment ||
        (params.action === 'approve'
          ? 'Approved and merged by data owner.'
          : 'Rejected by data owner.');
      mr.updatedAt = now;

      this.mergeRequestsStore.set(mr.id, mr);
      return mr;
    },
  };

  // ============================================================================
  // FS NODE ORM REPOSITORY
  // ============================================================================
  public fsNode = {
    findMany: async (query: FindManyQuery = {}): Promise<FsNodeRecord[]> => {
      let items = Array.from(this.fsNodesStore.values());

      if (query.where) {
        const { parentId, type, search, idIn, ancestorsHas } = query.where;
        if (parentId !== undefined) {
          items = items.filter(n => n.parentId === parentId);
        }
        if (type !== undefined && type !== 'all' && type !== '') {
          items = items.filter(n => Number(n.type) === Number(type));
        }
        if (idIn) {
          const set = new Set(idIn);
          items = items.filter(n => set.has(n.id));
        }
        if (ancestorsHas) {
          items = items.filter(n => n.ancestors.includes(ancestorsHas));
        }
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          items = items.filter(
            n =>
              n.name.toLowerCase().includes(q) ||
              n.id.toLowerCase().includes(q) ||
              (n.content_json && n.content_json.toLowerCase().includes(q))
          );
        }
      }

      if (query.orderBy) {
        const { field, direction } = query.orderBy;
        const mul = direction === 'desc' ? -1 : 1;
        items.sort((a, b) => {
          const av = (a as any)[field] ?? '';
          const bv = (b as any)[field] ?? '';
          if (av < bv) return -1 * mul;
          if (av > bv) return 1 * mul;
          return 0;
        });
      } else {
        items.sort((a, b) => {
          if (a.type === FsNodeType.Directory && b.type !== FsNodeType.Directory) return -1;
          if (a.type !== FsNodeType.Directory && b.type === FsNodeType.Directory) return 1;
          return a.name.localeCompare(b.name);
        });
      }

      const skip = query.skip ?? 0;
      const take = query.take ?? items.length;
      return items.slice(skip, skip + take);
    },

    paginate: async (params: {
      page?: number;
      pageSize?: number;
      search?: string;
      type?: string | number;
      parentId?: string | null;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }): Promise<PaginatedResult<FsNodeRecord>> => {
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Math.min(200, Number(params.pageSize) || 10));

      const allItems = Array.from(this.fsNodesStore.values());
      const typeCounts: Record<string, number> = {
        all: allItems.length,
        [FsNodeType.Directory]: allItems.filter(x => x.type === FsNodeType.Directory).length,
        [FsNodeType.FileJson]: allItems.filter(x => x.type === FsNodeType.FileJson).length,
        [FsNodeType.FileBinary]: allItems.filter(x => x.type === FsNodeType.FileBinary).length,
      };

      const filtered = await this.fsNode.findMany({
        where: {
          parentId: params.parentId,
          type: params.type,
          search: params.search,
        },
        orderBy: params.sortBy
          ? { field: params.sortBy, direction: params.sortDir || 'asc' }
          : undefined,
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return {
        items,
        total,
        page: safePage,
        pageSize,
        totalPages,
        typeCounts,
      };
    },

    findUnique: async (id: string): Promise<FsNodeRecord | null> => {
      return this.fsNodesStore.get(id) || null;
    },

    create: async (data: {
      name: string;
      type: FsNodeType;
      content_json?: string;
      parentId?: string | null;
      authorId?: string;
    }): Promise<FsNodeRecord> => {
      const parentId = data.parentId || null;
      let ancestors: string[] = [];

      if (parentId) {
        const parent = this.fsNodesStore.get(parentId);
        if (!parent) {
          throw new Error(`Parent directory "${parentId}" not found`);
        }
        if (parent.type !== FsNodeType.Directory) {
          throw new Error(`Target parent "${parent.name}" is not a directory`);
        }
        ancestors = [...parent.ancestors, parent.id];
      }

      const author = AUTHORS.find(a => a.id === data.authorId) || AUTHORS[0]!;
      const now = new Date().toISOString();
      const node: FsNodeRecord = {
        id: this.nextId(data.type === FsNodeType.Directory ? 'dir' : 'file'),
        name: data.name.trim(),
        type: Number(data.type) as FsNodeType,
        content_json:
          data.content_json ||
          (Number(data.type) === FsNodeType.FileJson
            ? JSON.stringify({ created: now, name: data.name.trim(), owner: author.handle }, null, 2)
            : ''),
        parentId,
        ancestors,
        author,
        createdAt: now,
        updatedAt: now,
      };

      this.fsNodesStore.set(node.id, node);
      return node;
    },

    update: async (
      id: string,
      data: Partial<Pick<FsNodeRecord, 'name' | 'content_json' | 'parentId' | 'ancestors'>>
    ): Promise<FsNodeRecord> => {
      const existing = this.fsNodesStore.get(id);
      if (!existing) {
        throw new Error(`Node "${id}" not found`);
      }
      const updated: FsNodeRecord = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.fsNodesStore.set(id, updated);
      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      if (!this.fsNodesStore.has(id)) return false;
      for (const [key, node] of this.fsNodesStore.entries()) {
        if (node.ancestors.includes(id)) {
          this.fsNodesStore.delete(key);
        }
      }
      this.fsNodesStore.delete(id);
      return true;
    },
  };

  // ============================================================================
  // TABLE ROW & ENTITY ORM REPOSITORY
  // ============================================================================
  public entityRow = {
    paginate: async (params: {
      page?: number;
      pageSize?: number;
      type?: string;
      search?: string;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
      authorId?: string;
    }): Promise<PaginatedResult<TableRow>> => {
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Math.min(5000, Number(params.pageSize) || 100));

      const typeCounts: Record<string, number> = { All: this.rowsStore.length };
      for (const r of this.rowsStore) {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      }

      let pool = this.rowsStore;
      if (params.type && params.type !== 'All') {
        pool = pool.filter(r => r.type === params.type);
      }

      if (params.authorId && params.authorId !== 'all') {
        pool = pool.filter(r => r.author?.id === params.authorId);
      }

      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        pool = pool.filter(
          r =>
            r.label.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q) ||
            r.entityId.toLowerCase().includes(q) ||
            r.author?.name.toLowerCase().includes(q) ||
            r.fields.some(
              f =>
                String(f.value).toLowerCase().includes(q) ||
                f.key.toLowerCase().includes(q)
            )
        );
      }

      if (params.sortBy) {
        const key = params.sortBy;
        const dir = params.sortDir === 'desc' ? -1 : 1;
        pool = [...pool].sort((a, b) => {
          let av: string | number = 0;
          let bv: string | number = 0;
          if (key === '_idx') {
            av = a.index;
            bv = b.index;
          } else if (key === '_label') {
            av = a.label;
            bv = b.label;
          } else if (key === '_type') {
            av = a.type;
            bv = b.type;
          } else if (key === '_fields') {
            av = a.fieldCount;
            bv = b.fieldCount;
          } else if (key === '_edges') {
            av = a.connectedCount;
            bv = b.connectedCount;
          } else if (key === '_updated') {
            av = a.updatedAt;
            bv = b.updatedAt;
          } else {
            const af = a.fields.find(f => f.key === key);
            const bf = b.fields.find(f => f.key === key);
            av = af ? (typeof af.value === 'number' ? af.value : String(af.value)) : '';
            bv = bf ? (typeof bf.value === 'number' ? bf.value : String(bf.value)) : '';
          }
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }

      const total = pool.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const items = pool.slice(start, start + pageSize);

      return {
        items,
        total,
        page: safePage,
        pageSize,
        totalPages,
        typeCounts,
      };
    },

    findEntityById: async (id: string): Promise<Entity | null> => {
      if (this.entitiesStore.has(id)) {
        return this.entitiesStore.get(id)!;
      }
      const row = this.rowsStore.find(r => r.entityId === id || r.id === id);
      if (row) {
        const ent = rowToEntity(row);
        this.entitiesStore.set(ent.id, ent);
        return ent;
      }
      return null;
    },

    searchEntities: async (params: {
      query?: string;
      type?: string;
      sortBy?: 'relevance' | 'name' | 'fields';
      page?: number;
      pageSize?: number;
    }) => {
      const allEntities: Entity[] = [
        ...Array.from(this.entitiesStore.values()),
        ...this.rowsStore.slice(0, 120).map(r => rowToEntity(r)),
      ];

      const uniqueMap = new Map<string, Entity>();
      for (const e of allEntities) {
        uniqueMap.set(e.id, e);
      }
      let pool = Array.from(uniqueMap.values());

      const allTypes = ['All', ...Array.from(new Set(pool.map(e => e.type)))];

      if (params.type && params.type !== 'All') {
        pool = pool.filter(e => e.type === params.type);
      }

      const qStr = (params.query || '').trim();
      const q = qStr.toLowerCase();

      const scored = pool
        .map(e => {
          if (!q) {
            return {
              entity: e,
              score: 1,
              matches: [] as { field: EntityField; snippet: string }[],
            };
          }
          let score = 0;
          if (e.label.toLowerCase().includes(q)) score += 10;
          if (e.type.toLowerCase().includes(q)) score += 5;
          if (e.description.toLowerCase().includes(q)) score += 3;
          if (e.author?.name.toLowerCase().includes(q)) score += 4;

          const matches: { field: EntityField; snippet: string }[] = [];
          for (const f of e.fields) {
            const val = Array.isArray(f.value) ? f.value.join(' ') : String(f.value);
            if (f.key.toLowerCase().includes(q) || val.toLowerCase().includes(q)) {
              matches.push({ field: f, snippet: val });
            }
          }
          score += matches.slice(0, 4).length * 2;
          return { entity: e, score, matches: matches.slice(0, 4) };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => {
          if (params.sortBy === 'name') return a.entity.label.localeCompare(b.entity.label);
          if (params.sortBy === 'fields') return b.entity.fields.length - a.entity.fields.length;
          return b.score - a.score;
        });

      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Number(params.pageSize) || 25);
      const total = scored.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const items = scored.slice((safePage - 1) * pageSize, safePage * pageSize);

      return {
        items,
        total,
        page: safePage,
        pageSize,
        totalPages,
        types: allTypes,
      };
    },
  };

  // ============================================================================
  // GRAPH ORM REPOSITORY
  // ============================================================================
  public graph = {
    getGlobalGraph: async () => {
      return {
        nodes: this.graphNodesStore,
        edges: this.graphEdgesStore,
      };
    },

    getSubgraph: async (entityId: string, width = 420, height = 260) => {
      const entity = await this.entityRow.findEntityById(entityId);
      if (!entity) {
        throw new Error(`Entity "${entityId}" not found`);
      }
      return resolveLocalSubgraph(entity, width, height);
    },
  };
}

// Singleton Mock ORM instance
const globalForMockOrm = globalThis as unknown as { __mockOrm?: MockOrmClient };
export const mockOrm = globalForMockOrm.__mockOrm || new MockOrmClient();
if (!globalForMockOrm.__mockOrm) {
  globalForMockOrm.__mockOrm = mockOrm;
}
