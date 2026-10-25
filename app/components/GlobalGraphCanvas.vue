<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { GraphNode, GraphEdge, Entity } from '~/razomy/abstractions/graph';
import {Grid} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Button} from '@razomy/vue';
import {Badge} from '@razomy/vue';

const props = defineProps<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedEntityId?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-entity', entity: Entity): void;
  (e: 'reset'): void;
}>();

const LEGEND_TYPES = ['Person', 'Organization', 'Product', 'Event', 'Document', 'Concept'];

const localNodes = ref<GraphNode[]>([]);
const hoveredEdge = ref<string | null>(null);
const dragging = ref<{ id: string; ox: number; oy: number } | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const pan = ref({ x: 0, y: 0 });
const zoom = ref(1);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

watch(
  () => props.nodes,
  newNodes => {
    localNodes.value = newNodes.map(n => ({ ...n }));
  },
  { immediate: true }
);

function nodeById(id: string) {
  return localNodes.value.find(n => n.id === id);
}

const activeEdges = computed(() => {
  if (!props.selectedEntityId) return [];
  return props.edges
    .filter(ed => ed.source === props.selectedEntityId || ed.target === props.selectedEntityId)
    .map(e => e.id);
});

function getSVGPoint(e: MouseEvent) {
  if (!svgRef.value) return { x: 0, y: 0 };
  const rect = svgRef.value.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - pan.value.x) / zoom.value,
    y: (e.clientY - rect.top - pan.value.y) / zoom.value,
  };
}

function onNodeMouseDown(e: MouseEvent, node: GraphNode) {
  e.stopPropagation();
  const pt = getSVGPoint(e);
  dragging.value = { id: node.id, ox: pt.x - node.x, oy: pt.y - node.y };
  emit('select-entity', node.entity);
}

function onSVGMouseDown(e: MouseEvent) {
  if (e.target === svgRef.value || (e.target as SVGElement).tagName === 'rect') {
    isPanning.value = true;
    panStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
  }
}

function onMouseMove(e: MouseEvent) {
  if (dragging.value) {
    const pt = getSVGPoint(e);
    localNodes.value = localNodes.value.map(n =>
      n.id === dragging.value!.id
        ? { ...n, x: pt.x - dragging.value!.ox, y: pt.y - dragging.value!.oy }
        : n
    );
  } else if (isPanning.value) {
    pan.value = {
      x: e.clientX - panStart.value.x,
      y: e.clientY - panStart.value.y,
    };
  }
}

function onMouseUp() {
  dragging.value = null;
  isPanning.value = false;
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  zoom.value = Math.max(0.3, Math.min(3, zoom.value * delta));
}

function resetCanvas() {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
  emit('reset');
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <Grid variant="y_header_main_footer" full-height surface="default">
    <!-- Top Controls -->
    <Grid variant="x_between" padding="xs" surface="elevated" border="b">
      <Grid variant="x" gap="sm">
        <Badge :label="`${localNodes.length} nodes`" role="primary" />
        <Badge :label="`${edges.length} edges`" role="secondary" />
        <Body variant="xxsMono" color="muted">zoom {{ Math.round(zoom * 100) }}%</Body>
      </Grid>

      <Button
        variant="tonal"
        size="xs"
        color="primary"
        prepend-icon="mdi-restore"
        :loading="loading"
        @click="resetCanvas"
      >
        Reset Layout
      </Button>
    </Grid>

    <!-- SVG Stage -->
    <div class="ds-global-graph-stage">
      <svg
        ref="svgRef"
        class="ds-global-graph-svg"
        @mousedown="onSVGMouseDown"
        @wheel="onWheel"
      >
        <defs>
          <pattern id="global-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#global-grid)" />

        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- Edges -->
          <g
            v-for="edge in edges"
            :key="edge.id"
            @mouseenter="hoveredEdge = edge.id"
            @mouseleave="hoveredEdge = null"
          >
            <template v-if="nodeById(edge.source) && nodeById(edge.target)">
              <line
                :x1="nodeById(edge.source)!.x"
                :y1="nodeById(edge.source)!.y"
                :x2="nodeById(edge.target)!.x"
                :y2="nodeById(edge.target)!.y"
                stroke="currentColor"
                :stroke-width="activeEdges.includes(edge.id) || hoveredEdge === edge.id ? 2 : 1.2"
                :stroke-opacity="activeEdges.includes(edge.id) || hoveredEdge === edge.id ? 0.8 : 0.25"
              />
              <text
                v-if="activeEdges.includes(edge.id) || hoveredEdge === edge.id"
                :x="(nodeById(edge.source)!.x + nodeById(edge.target)!.x) / 2"
                :y="(nodeById(edge.source)!.y + nodeById(edge.target)!.y) / 2 - 6"
                text-anchor="middle"
                fill="currentColor"
                font-size="9"
                font-family="var(--ds-font-mono)"
              >
                {{ edge.label }}
              </text>
            </template>
          </g>

          <!-- Nodes -->
          <g
            v-for="node in localNodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="ds-global-graph-node"
            @mousedown="e => onNodeMouseDown(e, node)"
          >
            <circle
              :r="node.size"
              :fill="node.color"
              fill-opacity="0.2"
              :stroke="node.color"
              :stroke-width="selectedEntityId === node.id ? 3 : 1.5"
            />
            <circle :r="node.size * 0.45" :fill="node.color" />
            <text
              :y="node.size + 14"
              text-anchor="middle"
              fill="currentColor"
              font-size="11"
              :font-weight="selectedEntityId === node.id ? '700' : '500'"
            >
              {{ node.label.length > 15 ? node.label.slice(0, 14) + '…' : node.label }}
            </text>
            <text
              :y="node.size + 25"
              text-anchor="middle"
              fill="currentColor"
              opacity="0.65"
              font-size="8"
              font-family="var(--ds-font-mono)"
            >
              {{ node.type }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Legend Footer -->
    <Grid variant="x_start" gap="xs" padding="xs" surface="elevated" border="t">
      <Badge
        v-for="type in LEGEND_TYPES"
        :key="type"
        :label="type"
        :entity-type="type"
        dot
      />
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-global-graph-stage {
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}
.ds-global-graph-svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
.ds-global-graph-node {
  cursor: pointer;
}
</style>
