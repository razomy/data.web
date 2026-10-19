<!-- components/ide/IdeDockSide.vue -->
<template>
  <!-- 1. УЗКАЯ ПОЛОСА ИКОНОК (JetBrains Tool Window Bar - 36px) -->
  <v-navigation-drawer
    v-if="!isMobile && dock.tabs.length > 0"
    permanent
    rail
    :rail-width="RAIL_WIDTH"
    :location="side"
    elevation="0"
    :class="[borderClass, 'bg-surface-light']"
  >
    <v-list density="compact" nav class="pa-1 d-flex flex-column align-center">
      <v-tooltip
        v-for="tab in dock.tabs"
        :key="tab.id"
        :location="isLeft ? 'end' : 'start'"
        open-delay="300"
      >
        <template #activator="{ props }">
          <v-badge
            :model-value="Boolean(tab.badge)"
            :content="tab.badge"
            color="error"
            floating
            offset-x="4"
            offset-y="4"
          >
            <v-btn
              v-bind="props"
              :icon="tab.icon"
              :active="dock.activeTabId === tab.id"
              :color="dock.activeTabId === tab.id ? 'primary' : undefined"
              :variant="dock.activeTabId === tab.id ? 'tonal' : 'text'"
              density="comfortable"
              size="small"
              class="mb-1 rounded"
              @click="toggleTab(side, tab.id)"
            />
          </v-badge>
        </template>
        <span>{{ tab.title }}</span>
        <span v-if="tab.shortcut" class="text-disabled ml-1">({{ tab.shortcut }})</span>
      </v-tooltip>
    </v-list>
  </v-navigation-drawer>

  <!-- 2. ВЫДВИЖНАЯ ПАНЕЛЬ КОНТЕНТА (Tool Window) -->
  <v-navigation-drawer
    :model-value="Boolean(activeTab)"
    :width="isMobile ? displayWidth : dock.width"
    :temporary="isMobile"
    :location="side"
    elevation="0"
    :class="borderClass"
    @update:model-value="val => !val && (dock.activeTabId = null)"
  >
    <!-- Шапка инструментального окна -->
    <template v-if="activeTab" #prepend>
      <v-toolbar density="compact" height="32" color="surface" class="border-b px-2">
        <!-- Переключатель табов на мобилке -->
        <v-slide-group v-if="isMobile && dock.tabs.length > 1" v-model="dock.activeTabId">
          <v-slide-group-item
            v-for="t in dock.tabs"
            :key="t.id"
            :value="t.id"
            v-slot="{ isSelected, select }"
          >
            <v-btn
              size="x-small"
              :variant="isSelected ? 'tonal' : 'text'"
              :prepend-icon="t.icon"
              class="mr-1 text-none"
              @click="select"
            >
              {{ t.title }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Заголовок на десктопе -->
        <template v-else>
          <v-icon :icon="activeTab.icon" size="14" class="mr-1.5 text-medium-emphasis" />
          <span class="text-caption font-weight-bold text- truncate">
            {{ activeTab.title }}
          </span>
        </template>

        <v-spacer />

        <!-- Кнопка сворачивания -->
        <v-btn
          :icon="isMobile ? 'mdi-close' : 'mdi-minus'"
          variant="text"
          density="compact"
          size="small"
          title="Скрыть (Esc)"
          @click="dock.activeTabId = null"
        />
      </v-toolbar>
    </template>

    <!-- Контент вкладки с сохранением состояния (KeepAlive) -->
    <v-sheet v-if="activeTab" class="pa-2 h-100 overflow-y-auto bg-transparent">
      <KeepAlive>
        <component
          :is="activeTab.component"
          :key="activeTab.id"
          v-bind="activeTab.props"
        />
      </KeepAlive>
    </v-sheet>

    <!-- 3. ИНТЕРАКТИВНЫЙ РЕСАЙЗЕР (Без кастомного CSS, на базе v-sheet) -->
    <v-sheet
      v-if="!isMobile"
      :color="isHoveringResize || isResizing ? 'primary' : 'transparent'"
      width="4"
      class="position-absolute top-0 bottom-0"
      :class="isLeft ? 'right-0' : 'left-0'"
      style="cursor: col-resize; z-index: 100; transition: background-color 0.15s"
      title="Потяните для изменения размера (Двойной клик — сброс)"
      @mouseenter="isHoveringResize = true"
      @mouseleave="isHoveringResize = false"
      @mousedown.prevent="startResize"
      @dblclick="resetWidth(side)"
    />
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
import { useIdeLayout, type DockSide } from '~/composables/useIdeLayout'

const props = defineProps<{ side: DockSide }>()
const emit = defineEmits<{ (e: 'resize-state', val: boolean): void }>()

const RAIL_WIDTH = 36 // Компактный размер как в современном JetBrains UI
const { docks, toggleTab, resetWidth } = useIdeLayout()
const { mobile: isMobile, width: displayWidth } = useDisplay()

const dock = computed(() => docks[props.side].value)
const isLeft = computed(() => props.side === 'left')
const borderClass = computed(() => (isLeft.value ? 'border-e' : 'border-s'))
const activeTab = computed(() => dock.value.tabs.find(t => t.id === dock.value.activeTabId) || null)

// Логика ресайза, инкапсулированная внутри панели
const isHoveringResize = ref(false)
const isResizing = ref(false)

const startResize = () => {
  isResizing.value = true
  emit('resize-state', true)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopResize)
}

const onMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return
  requestAnimationFrame(() => {
    const rawWidth = isLeft.value
      ? e.clientX - RAIL_WIDTH
      : window.innerWidth - e.clientX - RAIL_WIDTH

    dock.value.width = Math.max(
      dock.value.minWidth,
      Math.min(dock.value.maxWidth, rawWidth)
    )
  })
}

const stopResize = () => {
  if (!isResizing.value) return
  isResizing.value = false
  emit('resize-state', false)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(stopResize)
</script>
