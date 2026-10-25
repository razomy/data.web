<script setup lang="ts">
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Nav from '~/components/Nav.vue';


import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useDisplay} from 'vuetify'
import {useIdeLayout} from '~/composables/useIdeLayout'
import IdeDockSide from '~/components/IdeDockSide.vue'

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
  <Grid variant="y_header_main" surface="background" full-height clip class="ds-ide-shell">
<!--    <Nav/>-->
    <Grid as="main" variant="full" full-height clip>
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

<!--        <v-icon icon="mdi-console" size="small" color="primary" class="ml-2 mr-1"/>-->
<!--        <v-app-bar-title class="text-caption font-weight-bold">-->
<!--          JetBrains Style IDE-->
<!--        </v-app-bar-title>-->

<!--        <v-spacer/>-->

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
      <IdeDockSide side="left" @resize-state="isResizing = $event"/>
      <IdeDockSide side="right" @resize-state="isResizing = $event"/>

      <!-- РАБОЧАЯ ОБЛАСТЬ -->
<!--      <v-main :style="isResizing ? 'transition: none !important' : undefined">-->
        <v-sheet class="h-100 overflow-y-auto bg-background">
          <slot/>
        </v-sheet>
<!--      </v-main>-->

      <!-- НИЖНИЙ СТАТУС-БАР (Как в настоящей IDE, 24px) -->
<!--      <v-footer app height="24"-->
<!--                class="border-t bg-surface-light px-2 py-0 d-flex align-center justify-space-between text-caption text-medium-emphasis">-->
<!--        <div class="d-flex align-center ga-3">-->
<!--        <span class="d-flex align-center">-->
<!--          <v-icon icon="mdi-source-branch" size="12" class="mr-1"/> main*-->
<!--        </span>-->
<!--          <span class="d-flex align-center">-->
<!--          <v-icon icon="mdi-check-circle-outline" size="12" color="success" class="mr-1"/> 0 ошибок-->
<!--        </span>-->
<!--        </div>-->
<!--        <div class="d-flex align-center ga-3">-->
<!--          <span>UTF-8</span>-->
<!--          <span>Vue 3 / Nuxt</span>-->
<!--        </div>-->
<!--      </v-footer>-->
    </Grid>
  </Grid>
</template>

<style scoped>
.ds-ide-shell {
  height: 100vh;
  width: 100vw;
}
</style>
