<script setup lang="ts">
import type { FsNodeRecord } from '~/types/graph';
import Grid from '~/components/ds/layout/Grid.vue';
import Card from '~/components/ds/card/Card.vue';
import Body from '~/components/ds/typography/Body.vue';
import Button from '~/components/ds/button/Button.vue';
import Badge from '~/components/ds/elements/Badge.vue';
import TextInput from '~/components/ds/input/TextInput.vue';
import AppCopyBtn from './ui/AppCopyBtn.vue';

defineProps<{
  records: FsNodeRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  typeFilter: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  loading?: boolean;
  selectedId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'update:typeFilter', val: string): void;
  (e: 'update:pageSize', val: number): void;
  (e: 'page-change', page: number): void;
  (e: 'toggle-sort', field: string): void;
  (e: 'inspect', item: FsNodeRecord): void;
  (e: 'propose-mr', item: FsNodeRecord): void;
  (e: 'refresh'): void;
}>();
</script>

<template>
  <Grid variant="y" gap="md" padding="md" scrollable full-height>
    <Card padding="none" gap="none">
      <!-- Header -->
      <Grid variant="x_between" padding="md" surface="elevated" border="b">
        <Grid variant="y" gap="xss">
          <Grid variant="x" gap="xs">
            <Body variant="lgBold">Storage Nodes Table</Body>
            <Badge :label="`${total.toLocaleString()} nodes`" role="primary" />
          </Grid>
          <Body variant="xxsMono" color="muted">
            Click any storage node to inspect or propose a Merge Request
          </Body>
        </Grid>

        <Grid variant="x" gap="xs">
          <TextInput
            :model-value="search"
            placeholder="Search name, ID, JSON..."
            icon="mdi-magnify"
            clearable
            @update:model-value="emit('update:search', $event)"
            @clear="emit('update:search', '')"
          />
          <Button
            icon="mdi-refresh"
            variant="tonal"
            color="primary"
            size="sm"
            :loading="loading"
            @click="emit('refresh')"
          />
        </Grid>
      </Grid>

      <!-- Filter Bar -->
      <Grid variant="x_between" padding="sm" surface="panel" border="b">
        <Grid variant="x_start" gap="xs">
          <Body variant="xxsMono" color="muted">NODE TYPE:</Body>
          <Badge
            label="All"
            role="primary"
            :active="typeFilter === 'all'"
            clickable
            @click="emit('update:typeFilter', 'all')"
          />
          <Badge
            label="Directory"
            role="warning"
            :active="typeFilter === '2'"
            dot
            clickable
            @click="emit('update:typeFilter', '2')"
          />
          <Badge
            label="JSON File"
            role="success"
            :active="typeFilter === '1'"
            dot
            clickable
            @click="emit('update:typeFilter', '1')"
          />
          <Badge
            label="Binary"
            role="info"
            :active="typeFilter === '0'"
            dot
            clickable
            @click="emit('update:typeFilter', '0')"
          />
        </Grid>

        <Grid variant="x" gap="xs">
          <Body variant="xxsMono" color="muted">Page {{ page }} / {{ totalPages }}</Body>
        </Grid>
      </Grid>

      <!-- Data Table -->
      <v-table hover density="compact">
        <thead>
          <tr>
            <th @click="emit('toggle-sort', 'id')">
              <Body variant="xxsMono" color="muted">ID</Body>
            </th>
            <th @click="emit('toggle-sort', 'name')">
              <Body variant="xxsMono" color="muted">NAME</Body>
            </th>
            <th @click="emit('toggle-sort', 'type')">
              <Body variant="xxsMono" color="muted">TYPE</Body>
            </th>
            <th>
              <Body variant="xxsMono" color="muted">OWNER</Body>
            </th>
            <th @click="emit('toggle-sort', 'createdAt')">
              <Body variant="xxsMono" color="muted">UPDATED</Body>
            </th>
            <th class="text-right">
              <Body variant="xxsMono" color="muted">ACTIONS</Body>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in records"
            :key="item.id"
            @click="emit('inspect', item)"
          >
            <td><Body variant="xsMono" color="muted">{{ item.id }}</Body></td>
            <td>
              <Grid variant="x_start" gap="xs">
                <v-icon
                  :icon="item.type === 2 ? 'mdi-folder' : item.type === 1 ? 'mdi-code-json' : 'mdi-file-binary-outline'"
                  size="16"
                  :color="item.type === 2 ? 'warning' : 'primary'"
                />
                <Body variant="sMedium" truncate>{{ item.name }}</Body>
              </Grid>
            </td>
            <td>
              <Badge
                :label="item.type === 2 ? 'Directory' : item.type === 1 ? 'JSON' : 'Binary'"
                :role="item.type === 2 ? 'warning' : 'primary'"
              />
            </td>
            <td><Body variant="xxsMono" color="info">{{ item.author?.handle || '@sarah.chen' }}</Body></td>
            <td><Body variant="xsMono" color="muted">{{ item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—' }}</Body></td>
            <td @click.stop>
              <Grid variant="x_end" gap="xss">
                <Button
                  v-if="item.type !== 2"
                  variant="tonal"
                  size="xs"
                  color="secondary"
                  @click="emit('propose-mr', item)"
                >
                  MR
                </Button>
                <Button variant="text" size="xs" color="primary" @click="emit('inspect', item)">
                  Inspect
                </Button>
                <AppCopyBtn :text="item.id" label="ID" />
              </Grid>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination Footer -->
      <Grid variant="x_between" padding="sm" surface="elevated" border="t">
        <Body variant="xsMono" color="muted">
          Showing {{ total === 0 ? 0 : (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }} of {{ total }}
        </Body>
        <Grid variant="x" gap="xs">
          <Button
            variant="tonal"
            size="xs"
            :disabled="page <= 1 || loading"
            @click="emit('page-change', page - 1)"
          >
            Prev
          </Button>
          <Button
            variant="tonal"
            size="xs"
            :disabled="page >= totalPages || loading"
            @click="emit('page-change', page + 1)"
          >
            Next
          </Button>
        </Grid>
      </Grid>
    </Card>
  </Grid>
</template>