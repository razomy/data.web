import { AUTHORS, entities, graphEdges } from './mockData.ts';
import type { Entity, GraphEdge, GraphNode, LocalSubgraph, TableRow } from '~/razomy/abstractions/graph.ts';

export type { LocalSubgraph } from '~/razomy/abstractions/graph.ts';

const RELATION_TYPES = [
  'WORKS_AT',
  'MANAGES',
  'DEVELOPED',
  'USES',
  'DEPENDS_ON',
  'REFERENCES',
  'CONTRIBUTES_TO',
  'PARTNER_OF',
  'ORGANIZES',
  'COLLABORATES_WITH',
];

const TYPE_COLORS: Record<string, string> = {
  Person: '#00C9A7',
  Organization: '#7B61FF',
  Product: '#FF6B35',
  Event: '#E05A87',
  Document: '#4A9EFF',
  Concept: '#A8FF78',
};

const entityCache = new Map<string, Entity>();

for (const e of entities) {
  entityCache.set(e.id, e);
}

export function registerEntity(entity: Entity) {
  entityCache.set(entity.id, entity);
}

export function getEntityById(id: string): Entity | undefined {
  return entityCache.get(id);
}

export function rowToEntity(row: TableRow): Entity {
  const existing = entityCache.get(row.entityId);
  if (existing) return existing;

  const entity: Entity = {
    id: row.entityId,
    label: row.label,
    type: row.type,
    color: row.color || TYPE_COLORS[row.type] || '#00C9A7',
    description: `Structured ${row.type} dataset record with ${row.fieldCount} typed attributes and ${row.connectedCount} graph relationships. Maintained by ${row.author?.name || 'Sarah Chen'}.`,
    imageUrl: row.imageUrl,
    fields: row.fields,
    connectedTo: [],
    author: row.author || AUTHORS[0]!,
    createdAt: row.updatedAt + 'T00:00:00Z',
    updatedAt: row.updatedAt + 'T00:00:00Z',
  };

  entityCache.set(entity.id, entity);
  return entity;
}

export function resolveLocalSubgraph(
  target: Entity,
  canvasWidth = 420,
  canvasHeight = 260
): LocalSubgraph {
  registerEntity(target);

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  const centerNode: GraphNode = {
    id: target.id,
    label: target.label,
    type: target.type,
    color: target.color || TYPE_COLORS[target.type] || '#00C9A7',
    x: cx,
    y: cy,
    size: 26,
    entity: target,
  };

  const edges: GraphEdge[] = [];
  const neighborNodes: GraphNode[] = [];

  const directEdges = graphEdges.filter(
    e => e.source === target.id || e.target === target.id
  );

  if (directEdges.length > 0) {
    const neighborIds = new Set<string>();
    for (const e of directEdges) {
      const neighborId = e.source === target.id ? e.target : e.source;
      neighborIds.add(neighborId);
      edges.push(e);
    }

    const neighborArray = Array.from(neighborIds);
    const count = neighborArray.length;
    const radius = Math.min(cx, cy) * 0.72;

    neighborArray.forEach((nId, idx) => {
      const ent = entityCache.get(nId) || entities.find(x => x.id === nId);
      if (!ent) return;

      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      const nx = cx + radius * Math.cos(angle);
      const ny = cy + radius * Math.sin(angle);

      neighborNodes.push({
        id: ent.id,
        label: ent.label,
        type: ent.type,
        color: ent.color || TYPE_COLORS[ent.type] || '#7B61FF',
        x: nx,
        y: ny,
        size: 18,
        entity: ent,
      });
    });
  } else {
    const seed = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pool = entities.filter(e => e.id !== target.id);
    const neighborCount = 3 + (seed % 3);

    const selectedNeighbors: Entity[] = [];
    for (let i = 0; i < neighborCount; i++) {
      const candidate = pool[(seed + i * 3) % pool.length];
      if (candidate && !selectedNeighbors.includes(candidate)) {
        selectedNeighbors.push(candidate);
      }
    }

    const radius = Math.min(cx, cy) * 0.72;
    const totalCount = selectedNeighbors.length;

    selectedNeighbors.forEach((neighbor, idx) => {
      const angle = (idx / totalCount) * 2 * Math.PI - Math.PI / 2;
      const nx = cx + radius * Math.cos(angle);
      const ny = cy + radius * Math.sin(angle);

      neighborNodes.push({
        id: neighbor.id,
        label: neighbor.label,
        type: neighbor.type,
        color: neighbor.color || TYPE_COLORS[neighbor.type] || '#7B61FF',
        x: nx,
        y: ny,
        size: 18,
        entity: neighbor,
      });

      const relIndex = (seed + idx) % RELATION_TYPES.length;
      const isOutgoing = (seed + idx) % 2 === 0;

      edges.push({
        id: `gen-edge-${target.id}-${neighbor.id}`,
        source: isOutgoing ? target.id : neighbor.id,
        target: isOutgoing ? neighbor.id : target.id,
        label: RELATION_TYPES[relIndex]!,
        weight: 3 + (idx % 3),
      });
    });

    target.connectedTo = selectedNeighbors.map(n => n.id);
  }

  return {
    centerNode,
    neighborNodes,
    edges,
    allNodes: [centerNode, ...neighborNodes],
  };
}
