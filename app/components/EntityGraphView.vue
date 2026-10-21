<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { Entity, GraphNode, GraphEdge, LocalSubgraph } from '~/razomy/abstractions/graph';
import { resolveLocalSubgraph } from '~/data/graphResolver';
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Body from '~/razomy/ds-vue/typography/Body.vue';
import Button from '~/razomy/ds-vue/button/Button.vue';
import Badge from '~/razomy/ds-vue/elements/Badge.vue';

const props = withDefaults(
  defineProps<{
    entity: Entity;
    subgraphData?: LocalSubgraph | null;
    height?: number | string;
    isExpanded?: boolean;
  }>(),
  {
    subgraphData: null,
    height: 240,
    isExpanded: false,
  }
);

const emit = defineEmits<{
  (e: 'select-entity', entity: Entity): void;
  (e: 'preview-entity', entity: Entity): void;
  (e: 'toggle-expand'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const dims = ref({
  w: 420,
  h: typeof props.height === 'number' ? props.height : 240,
});
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const hoveredNode = ref<string | null>(null);
const dragging = ref<{ id: string; ox: number; oy: number } | null>(null);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

const subgraph = computed(() => {
  return resolveLocalSubgraph(props.entity, dims.value.w, dims.value.h);
});

const nodes = ref<GraphNode[]>(subgraph.value.allNodes);

watch(
  subgraph,
  newSub => {
    nodes.value = newSub.allNodes;
    zoom.value = 1;
    pan.value = { x: 0, y: 0 };
  },
  { immediate: true }
);

const edges = computed<GraphEdge[]>(() => subgraph.value.edges);

const nodeMap = computed(() => {
  const map = new Map<string, GraphNode>();
  for (const n of nodes.value) {
    map.set(n.id, n);
  }
  return map;
});

const centerNode = computed(() => {
  return nodeMap.value.get(props.entity.id) || nodes.value[0];
});

function getSVGPoint(e: MouseEvent) {
  if (!svgRef.value) return { x: 0, y: 0 };
  const rect = svgRef.value.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - pan.value.x) / zoom.value,
    y: (e.clientY - rect.top - pan.value.y) / zoom.value,
  };
}

function onNodeMouseDown(e: MouseEvent, nodeId: string) {
  e.stopPropagation();
  const pt = getSVGPoint(e);
  const node = nodes.value.find(n => n.id === nodeId);
  if (!node) return;
  dragging.value = { id: nodeId, ox: pt.x - node.x, oy: pt.y - node.y };
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
    nodes.value = nodes.value.map(n =>
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
  zoom.value = Math.max(0.4, Math.min(2.5, zoom.value * delta));
}

function resetView() {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
  nodes.value = subgraph.value.allNodes;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  if (containerRef.value) {
    const updateSize = () => {
      const rect = containerRef.value?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        dims.value = { w: rect.width, h: rect.height };
      }
    };
    updateSize();
    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<template>
  <Grid
    variant="y_header_main_footer"
    surface="panel"
    border="b"
    :style="{ height: isExpanded ? '100%' : typeof height === 'number' ? height + 'px' : height }"
  >
    <!-- Top Bar -->
    <Grid variant="x_between" padding="xs" surface="elevated" border="b">
      <Grid variant="x" gap="xs">
        <Badge :label="`${edges.length} links`" role="primary" dot />
        <Body variant="xxsMono" color="muted">{{ nodes.length - 1 }} neighbor nodes</Body>
      </Grid>

      <Grid variant="x" gap="xss">
        <Button size="xs" variant="tonal" @click="zoom = Math.min(2.5, zoom * 1.2)">+</Button>
        <Button size="xs" variant="tonal" @click="zoom = Math.max(0.4, zoom * 0.8)">-</Button>
        <Button size="xs" variant="tonal" @click="resetView">Reset</Button>
        <Button size="xs" variant="tonal" @click="emit('toggle-expand')">
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </Button>
      </Grid>
    </Grid>

    <!-- SVG Canvas -->
    <div ref="containerRef" class="ds-graph-stage">
      <svg
        ref="svgRef"
        class="ds-graph-svg"
        @mousedown="onSVGMouseDown"
        @wheel="onWheel"
      >
        <defs>
          <pattern id="sb-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#sb-grid)" />

        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- Edges -->
          <g v-for="edge in edges" :key="edge.id">
            <template v-if="nodeMap.get(edge.source) && nodeMap.get(edge.target)">
              <line
                :x1="nodeMap.get(edge.source)!.x"
                :y1="nodeMap.get(edge.source)!.y"
                :x2="nodeMap.get(edge.target)!.x"
                :y2="nodeMap.get(edge.target)!.y"
                stroke="currentColor"
                stroke-opacity="0.35"
                stroke-width="1.5"
                stroke-dasharray="3 3"
              />
              <text
                :x="(nodeMap.get(edge.source)!.x + nodeMap.get(edge.target)!.x) / 2"
                :y="(nodeMap.get(edge.source)!.y + nodeMap.get(edge.target)!.y) / 2 - 4"
                text-anchor="middle"
                fill="currentColor"
                opacity="0.75"
                font-size="8"
                font-family="var(--ds-font-mono)"
              >
                {{ edge.label }}
              </text>
            </template>
          </g>

          <!-- Nodes -->
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="ds-graph-node"
            @mousedown="e => onNodeMouseDown(e, node.id)"
            @mouseenter="hoveredNode = node.id"
            @mouseleave="hoveredNode = null"
            @click.stop="node.id !== centerNode?.id && node.entity && emit('select-entity', node.entity)"
          >
            <circle
              :r="node.size"
              :fill="node.color"
              :fill-opacity="node.id === centerNode?.id ? 0.3 : 0.18"
              :stroke="node.color"
              :stroke-width="node.id === centerNode?.id || hoveredNode === node.id ? 2.5 : 1.5"
            />
            <circle
              :r="node.size * 0.42"
              :fill="node.color"
            />
            <text
              :y="node.size + 13"
              text-anchor="middle"
              fill="currentColor"
              font-size="10"
              font-weight="600"
            >
              {{ node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Footer -->
    <Grid variant="x_between" padding="xs" surface="default" border="t">
      <Body variant="xxsMono" color="muted">Click any linked node to navigate</Body>
      <Body variant="xxsMono" color="light">drag · pan · zoom</Body>
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-graph-stage {
  width: 100%;
  height: 100%;
  min-height: 160px;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}
.ds-graph-svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
.ds-graph-node {
  cursor: pointer;
}
</style>
