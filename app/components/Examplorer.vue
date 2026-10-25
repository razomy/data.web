<template>
  <VfsAside
    :controller="myApiController"
    v-model:selectedItem="mappedItem"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IVfsController, VfsItem, VfsQuery } from '../razomy/ui-vue/vfs/types.ts';
import VfsAside from "~/razomy/ui-vue/vfs/VfsAside.vue";

// Внешняя или основная модель (строка)
const selectedItem = defineModel<string>('selectedItem', { default: 'Color' });

// Если вам все еще нужна отдельная модель для полного объекта наружу, оставьте её,
// но для маппинга со строкой достаточно computed:
const mappedItem = computed<VfsItem | null>({
  // Преобразуем строку (selectedItem) в объект (VfsItem) для VfsAside
  get() {
    if (!selectedItem.value) return null;

    return createVfsItem(selectedItem.value);
  },
  // Когда VfsAside меняет выбранный элемент, достаем из него строку обратно
  set(newItem) {
    selectedItem.value = newItem ? newItem.id : 'Color'; // или newItem.name
  }
});

// Выносим функцию создания объекта, чтобы переиспользовать и в контроллере, и в computed
function createVfsItem(name: string): VfsItem {
  return {
    id: name,
    parentId: null,
    isFolder: false,
    name: name,
    type: 'table',
    meta: { url: name }
  };
}

const names = [
  'MediaType', 'UnicodeCharacter', 'ProgrammingLanguage', 'Country',
  'Locale', 'Occupation', 'Currency', 'Timezone', 'PostalFormat',
  'TelecomPrefix', 'Color', 'TopLevelDomain', 'UserAgent',
  'MeasurementUnit', 'University', 'Airport', 'HttpStatus', 'ZodiacSign',
];

const myApiController: IVfsController = {
  async fetchItems({ parentId, search, page, limit }: VfsQuery) {
    // Используем ту же функцию для генерации списка
    const items: VfsItem[] = names.map(createVfsItem);

    return {
      items,
      total: items.length,
    };
  }
};
</script>


<!--<template>-->

<!--  <VfsAside-->
<!--    :controller="myApiController"-->
<!--    v-model:selectedItem="item"-->
<!--  />-->

  <!-- Use the Abstract Component -->
  <!--  <VfsExplorer :controller="myApiController">-->

  <!-- Inject the Preview Template via Scoped Slot -->
  <!--    <template #preview="{ item }">-->
  <!--      <v-card flat class="bg-transparent">-->
  <!--        <v-card-title class="d-flex align-center">-->
  <!--          <v-icon class="mr-2">{{ item.isFolder ? 'mdi-folder' : 'mdi-file' }}</v-icon>-->
  <!--          {{ item.name }}-->
  <!--        </v-card-title>-->

  <!--        <v-divider class="my-2"/>-->

  <!--        &lt;!&ndash; Custom logic based on item type &ndash;&gt;-->
  <!--        <div v-if="item.isFolder" class="text-grey">-->
  <!--          Folder statistics or quick actions can go here.-->
  <!--        </div>-->

  <!--        <div v-else-if="item.type === 'image'">-->
  <!--          <v-img :src="item.meta?.url" height="200" cover class="rounded"/>-->
  <!--        </div>-->

  <!--        <div v-else class="bg-grey-darken-4 text-white pa-4 rounded font-weight-mono">-->
  <!--          // Code Preview for {{ item.name }}-->
  <!--          console.log("Hello World");-->
  <!--        </div>-->

  <!--        <v-card-actions class="mt-4 px-0">-->
  <!--          <v-btn color="primary" variant="tonal" size="small">Download</v-btn>-->
  <!--          <v-btn color="error" variant="text" size="small">Delete</v-btn>-->
  <!--        </v-card-actions>-->
  <!--      </v-card>-->
  <!--    </template>-->

  <!--  </VfsExplorer>-->

<!--</template>-->

<!--<script setup lang="ts">-->
<!--import type {IVfsController, VfsItem, VfsQuery} from '../razomy/ui-vue/vfs/types.ts';-->
<!--import VfsAside from "~/razomy/ui-vue/vfs/VfsAside.vue";-->

<!--const item = defineModel<VfsItem | null>('item', { default: null });-->
<!--const selectedItem = defineModel<string | null>('selectedItem', { default: 'Color' });-->



<!--// 1. Setup the Controller Outside (Can be Axios, GraphQL, or Mock)-->
<!--const myApiController: IVfsController = {-->
<!--  async fetchItems({parentId, search, page, limit}: VfsQuery) {-->
<!--    // Simulate network latency-->
<!--    // await new Promise((r) => setTimeout(r, 400));-->

<!--    // Mock Data Generation-->

<!--    const names = [-->
<!--      'MediaType',-->
<!--      'UnicodeCharacter',-->
<!--      'ProgrammingLanguage',-->
<!--      'Country',-->
<!--      'Locale',-->
<!--      'Occupation',-->
<!--      'Currency',-->
<!--      'Timezone',-->
<!--      'PostalFormat',-->
<!--      'TelecomPrefix',-->
<!--      'Color',-->
<!--      'TopLevelDomain',-->
<!--      'UserAgent',-->
<!--      'MeasurementUnit',-->
<!--      'University',-->
<!--      'Airport',-->
<!--      'HttpStatus',-->
<!--      'ZodiacSign',-->
<!--    ]-->

<!--    const items: VfsItem[] = names.map(n => ({-->
<!--      id: n,-->
<!--      parentId: null,-->
<!--      isFolder: false,-->
<!--      name: n,-->
<!--      type: 'table',-->
<!--      meta: {url: n}-->
<!--    }));-->

<!--    return {-->
<!--      items,-->
<!--      total: items.length, // Pretend there are 50 items total per folder to show pagination-->
<!--    };-->
<!--  }-->
<!--};-->
<!--</script>-->
