<script setup lang="ts">
import {Grid} from '@razomy/vue';


import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useDisplay} from 'vuetify'
import {useIdeLayout} from '~/razomy/tab/useIdeLayout.ts'
import IdeDockSide from '~/razomy/tab/IdeDockSide.vue'

const {leftDock, rightDock, toggleTab} = useIdeLayout()
const {mobile: isMobile} = useDisplay()
const isResizing = ref(false)

// Хоткей: закрытие активного правого окна по Escape (поведение как в IDE)
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && rightDock.value.activeTabId) {
    rightDock.value.activeTabId = null
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <Grid variant="y_1fr_auto" surface="background" full-height clip>

    <v-layout as="main" variant="full" full-height clip>
      <!-- ВЕРХНЯЯ ПАНЕЛЬ (Компактная, 36px) -->
      <v-app-bar height="36" elevation="0" class="border-b bg-surface px-1">
        <!-- Мобильное меню для левого дока -->
        <v-menu v-if="isMobile && leftDock.tabs.length">
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props" size="x-small" variant="text"/>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="tab in leftDock.tabs"
              :key="tab.id"
              :prepend-icon="tab.icon"
              :title="tab.title"
              @click="leftDock.activeTabId = tab.id"
            />
          </v-list>
        </v-menu>

        <!-- Мобильные кнопки для правого дока -->
        <template v-if="isMobile">
          <v-btn
            v-for="tab in rightDock.tabs"
            :key="tab.id"
            :icon="tab.icon"
            size="x-small"
            variant="text"
            :color="rightDock.activeTabId === tab.id ? 'primary' : undefined"
            @click="toggleTab('right', tab.id)"
          />
        </template>
      </v-app-bar>

      <!-- ЛЕВЫЙ И ПРАВЫЙ ДОКИ (Переиспользуемый компонент!) -->
      <IdeDockSide class_="border-s" side="left" @resize-state="isResizing = $event"/>
      <IdeDockSide side="right" @resize-state="isResizing = $event"/>

      <!-- РАБОЧАЯ ОБЛАСТЬ -->
      <v-main :style="isResizing ? 'transition: none !important' : undefined">
        <v-sheet class="h-100 overflow-y-auto bg-background">
          <slot/>
        </v-sheet>
      </v-main>
    </v-layout>
  </Grid>
</template>
