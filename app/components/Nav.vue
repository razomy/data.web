<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Body from '~/razomy/ds-vue/typography/Body.vue';
import Button from '~/razomy/ds-vue/button/Button.vue';
import Badge from '~/razomy/ds-vue/elements/Badge.vue';

defineProps<{
  openMrCount?: number;
}>();

const route = useRoute();
const router = useRouter();

const NAV_ITEMS = [
  { id: 'workspace', path: '/', label: 'IDE Studio', icon: 'mdi-view-dashboard-variant-outline' },
  { id: 'entities', path: '/entities', label: 'Relational Tables', icon: 'mdi-database' },
  { id: 'table', path: '/table', label: 'Storage Nodes', icon: 'mdi-table' },
  { id: 'nodes', path: '/nodes', label: 'Knowledge Graph', icon: 'mdi-graph' },
  { id: 'search', path: '/search', label: 'Global Search', icon: 'mdi-magnify' },
];

const currentPath = computed(() => route.path);
</script>

<template>
  <Grid
    as="header"
    variant="x_auto_1fr_auto"
    padding="xs"
    gap="md"
    surface="default"
    border="b"
  >
    <!-- Brand -->
    <Grid variant="x" gap="xs" interactive @click="router.push('/')">
      <v-icon icon="mdi-hubspot" color="primary" size="20" />
      <Body variant="mBold">GraphOS IDE</Body>
      <Badge label="Git-DB" role="primary" />
    </Grid>

    <!-- Navigation links -->
    <Grid variant="x_start" gap="xss">
      <Button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        :to="item.path"
        :prepend-icon="item.icon"
        :variant="currentPath === item.path ? 'tonal' : 'text'"
        :color="currentPath === item.path ? 'primary' : 'default'"
        size="sm"
      >
        {{ item.label }}
      </Button>
    </Grid>

    <!-- Status indicator -->
    <Grid variant="x" gap="xs" padding="xs" surface="panel" border="all" rounded>
      <Badge label="CONNECTED" role="success" dot />
      <Body variant="xxsMono" color="muted">JetBrains DataGrip Mode</Body>
    </Grid>
  </Grid>
</template>
