<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TableCellValue from './TableCellValue.vue';
import type { TableRow } from '~/razomy/abstractions/graph';
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Badge from '~/razomy/ui-vue/elements/Badge.vue';

export interface ColDef {
  key: string;
  label: string;
  width: number;
  fieldKey?: string;
  type?: 'base' | 'field';
}

const props = withDefaults(
  defineProps<{
    rows: TableRow[];
    typeFilter: string;
    searchQuery: string;
    selectedRowId?: string;
  }>(),
  {
    selectedRowId: undefined,
  }
);

const emit = defineEmits<{
  (e: 'row-click', row: TableRow, fieldKey?: string): void;
}>();

const ROW_H = 38;
const OVERSCAN = 20;

const containerRef = ref<HTMLDivElement | null>(null);
const scrollTop = ref(0);
const containerH = ref(600);
const sortKey = ref<string>('_idx');
const sortDir = ref<'asc' | 'desc'>('asc');

const BASE_COLS: ColDef[] = [
  { key: '_idx', label: '#', width: 52, type: 'base' },
  { key: '_id', label: 'ID', width: 78, type: 'base' },
  { key: '_type', label: 'Type', width: 112, type: 'base' },
  { key: '_label', label: 'Record Label', width: 195, type: 'base' },
  { key: '_author', label: 'Git Owner', width: 145, type: 'base' },
  { key: '_fields', label: 'Attrs', width: 62, type: 'base' },
  { key: '_edges', label: 'Links', width: 62, type: 'base' },
  { key: '_updated', label: 'Updated', width: 98, type: 'base' },
];

const cols = computed<ColDef[]>(() => {
  const type = props.typeFilter;
  const fieldKeys: { key: string; label: string; width: number }[] = [];

  if (type === 'Person' || type === 'All') {
    fieldKeys.push(
      { key: 'role', label: 'Role', width: 155 },
      { key: 'department', label: 'Dept', width: 150 },
      { key: 'email', label: 'Email', width: 195 },
      { key: 'location', label: 'Location', width: 130 },
      { key: 'yearsExperience', label: 'Exp', width: 56 },
      { key: 'salary', label: 'Salary', width: 90 },
      { key: 'remote', label: 'Remote', width: 75 },
      { key: 'skills', label: 'Skills', width: 200 }
    );
  } else if (type === 'Organization') {
    fieldKeys.push(
      { key: 'employees', label: 'Employees', width: 95 },
      { key: 'revenue', label: 'Revenue', width: 115 },
      { key: 'valuation', label: 'Valuation', width: 115 },
      { key: 'headquarters', label: 'HQ', width: 130 },
      { key: 'isPublic', label: 'Public', width: 70 },
      { key: 'seriesStage', label: 'Stage', width: 100 },
      { key: 'sector', label: 'Sector', width: 130 }
    );
  } else if (type === 'Product') {
    fieldKeys.push(
      { key: 'version', label: 'Version', width: 90 },
      { key: 'license', label: 'License', width: 105 },
      { key: 'monthlyPrice', label: 'Price/mo', width: 90 },
      { key: 'activeUsers', label: 'Users', width: 90 },
      { key: 'uptime', label: 'Uptime %', width: 90 },
      { key: 'avgQueryMs', label: 'Avg ms', width: 75 }
    );
  } else {
    fieldKeys.push(
      { key: 'startDate', label: 'Date', width: 96 },
      { key: 'attendees', label: 'Attendees', width: 90 },
      { key: 'format', label: 'Format', width: 95 }
    );
  }

  return [
    ...BASE_COLS,
    ...fieldKeys.map(fk => ({
      key: fk.key,
      label: fk.label,
      width: fk.width,
      fieldKey: fk.key,
      type: 'field' as const,
    })),
  ];
});

const totalW = computed(() => cols.value.reduce((s, c) => s + c.width, 0));
const gridTemplateCols = computed(() => cols.value.map(c => `${c.width}px`).join(' '));

const sortedRows = computed(() => {
  const col = cols.value.find(c => c.key === sortKey.value);
  if (!col) return props.rows;

  return [...props.rows].sort((a, b) => {
    let av: string | number = 0;
    let bv: string | number = 0;
    if (col.fieldKey) {
      const af = a.fields.find(f => f.key === col.fieldKey);
      const bf = b.fields.find(f => f.key === col.fieldKey);
      av = af ? (typeof af.value === 'number' ? af.value : String(af.value)) : '';
      bv = bf ? (typeof bf.value === 'number' ? bf.value : String(bf.value)) : '';
    } else {
      if (sortKey.value === '_idx') { av = a.index; bv = b.index; }
      else if (sortKey.value === '_label') { av = a.label; bv = b.label; }
      else if (sortKey.value === '_type') { av = a.type; bv = b.type; }
      else if (sortKey.value === '_author') { av = a.author?.name || ''; bv = b.author?.name || ''; }
      else if (sortKey.value === '_fields') { av = a.fieldCount; bv = b.fieldCount; }
      else if (sortKey.value === '_edges') { av = a.connectedCount; bv = b.connectedCount; }
      else if (sortKey.value === '_updated') { av = a.updatedAt; bv = b.updatedAt; }
    }
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1;
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const totalH = computed(() => sortedRows.value.length * ROW_H);
const startIdx = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_H) - OVERSCAN));
const visCount = computed(() => Math.ceil(containerH.value / ROW_H) + OVERSCAN * 2);
const endIdx = computed(() => Math.min(sortedRows.value.length - 1, startIdx.value + visCount.value));
const visRows = computed(() => sortedRows.value.slice(startIdx.value, endIdx.value + 1));

function onScroll(e: Event) {
  const target = e.currentTarget as HTMLDivElement;
  scrollTop.value = target.scrollTop;
}

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        containerH.value = entries[0].contentRect.height;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<template>
  <Grid variant="y_auto_1fr" full-height clip surface="default">
    <div class="ds-vtable-scroll-x">
      <!-- Sticky Grid Header -->
      <div
        class="ds-vtable-header"
        :style="{ minWidth: totalW + 'px', gridTemplateColumns: gridTemplateCols }"
      >
        <div
          v-for="col in cols"
          :key="col.key"
          class="ds-vtable-header__cell"
          @click="toggleSort(col.key)"
        >
          <Body variant="xxsMono" :color="sortKey === col.key ? 'primary' : 'muted'" uppercase truncate>
            {{ col.label }} {{ sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '' }}
          </Body>
        </div>
      </div>

      <!-- Virtual Scroll Body -->
      <div
        ref="containerRef"
        class="ds-vtable-body"
        :style="{ minWidth: totalW + 'px' }"
        @scroll="onScroll"
      >
        <div :style="{ height: totalH + 'px', position: 'relative' }">
          <div
            v-for="(row, i) in visRows"
            :key="row.id"
            class="ds-vtable-row"
            :class="{
              'ds-vtable-row--selected': selectedRowId === row.entityId || selectedRowId === row.id,
              'ds-vtable-row--alt': (startIdx + i) % 2 === 1,
            }"
            :style="{
              top: (startIdx + i) * ROW_H + 'px',
              height: ROW_H + 'px',
              minWidth: totalW + 'px',
              gridTemplateColumns: gridTemplateCols,
            }"
            @click="emit('row-click', row)"
          >
            <div
              v-for="col in cols"
              :key="col.key"
              class="ds-vtable-cell"
              :title="`Inspect ${row.label} (${col.label})`"
              @click.stop="emit('row-click', row, col.fieldKey || col.key)"
            >
              <Body v-if="col.key === '_idx'" variant="xxsMono" color="light">
                {{ row.index + 1 }}
              </Body>
              <Body v-else-if="col.key === '_id'" variant="xsMono" color="muted">
                {{ row.entityId }}
              </Body>
              <Badge v-else-if="col.key === '_type'" :label="row.type" :entity-type="row.type" />
              <Body v-else-if="col.key === '_label'" variant="sSemiBold" truncate>
                {{ row.label }}
              </Body>
              <Body v-else-if="col.key === '_author'" variant="xxsMono" color="info" truncate>
                {{ row.author?.handle || '@sarah.chen' }}
              </Body>
              <Body v-else-if="col.key === '_fields'" variant="xsMono" color="primary">
                {{ row.fieldCount }}
              </Body>
              <Body v-else-if="col.key === '_edges'" variant="xsMono" color="secondary">
                {{ row.connectedCount }}
              </Body>
              <Body v-else-if="col.key === '_updated'" variant="xxsMono" color="muted">
                {{ row.updatedAt }}
              </Body>
              <template v-else-if="col.fieldKey">
                <TableCellValue
                  v-if="row.fields.find(x => x.key === col.fieldKey)"
                  :field="row.fields.find(x => x.key === col.fieldKey)!"
                />
                <Body v-else variant="xxsMono" color="light">—</Body>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Grid>
</template>

<style scoped>
.ds-vtable-scroll-x {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.ds-vtable-header {
  display: grid;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgb(var(--v-theme-surface-light, var(--v-theme-surface)));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.ds-vtable-header__cell {
  display: grid;
  align-items: center;
  padding: 0 8px;
  height: 34px;
  cursor: pointer;
  user-select: none;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.ds-vtable-body {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.ds-vtable-row {
  display: grid;
  position: absolute;
  width: 100%;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  background-color: rgb(var(--v-theme-surface));
  border-left: 3px solid transparent;
  transition: background-color 0.1s ease;
}

.ds-vtable-row--alt {
  background-color: rgba(var(--v-theme-surface-variant), 0.12);
}

.ds-vtable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.ds-vtable-row--selected {
  background-color: rgba(var(--v-theme-primary), 0.14) !important;
  border-left-color: rgb(var(--v-theme-primary));
}

.ds-vtable-cell {
  display: grid;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
}
</style>
