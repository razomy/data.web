<script setup lang="ts">
import Examplorer from "~/components/Examplorer.vue";
import {useIdeLayout} from "~/razomy/tab/useIdeLayout.ts";
import Tabller from "~/components/Tabller.vue";

const {definePageTabs, openWithContext} = useIdeLayout()
const selectedItem = ref<string>('Color');

definePageTabs({
  left: [
    {
      id: 'project',
      title: 'Проект',
      icon: 'mdi-folder-outline',
      shortcut: 'Alt+1',
      component: {
        render: () => h(Examplorer, {
          selectedItem: selectedItem.value,
          "onUpdate:selectedItem"(v: string) {
            selectedItem.value = v
          }
        }),
      },
    },
  ],
});


</script>

<template>
  <Tabller v-model:selectedItem="selectedItem"></Tabller>
</template>
