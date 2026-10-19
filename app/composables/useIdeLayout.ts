// composables/useIdeLayout.ts
import { markRaw, onMounted, onScopeDispose, type Component } from 'vue'
import { useState } from '#app'

export type DockSide = 'left' | 'right'

export interface ToolWindow {
  id: string
  title: string
  icon: string
  component: Component
  props?: Record<string, any>
  badge?: string | number
  shortcut?: string // Например: 'Alt+1'
}

export interface DockSideState {
  activeTabId: string | null
  width: number
  defaultWidth: number
  minWidth: number
  maxWidth: number
  tabs: ToolWindow[]
}

export const useIdeLayout = () => {
  const docks = {
    left: useState<DockSideState>('ide-dock-left', () => ({
      activeTabId: 'project',
      width: 260,
      defaultWidth: 260,
      minWidth: 180,
      maxWidth: 550,
      tabs: []
    })),
    right: useState<DockSideState>('ide-dock-right', () => ({
      activeTabId: null,
      width: 320,
      defaultWidth: 320,
      minWidth: 220,
      maxWidth: 650,
      tabs: []
    }))
  }

  const registerTab = (side: DockSide, tab: ToolWindow) => {
    const dock = docks[side].value
    const safeTab: ToolWindow = { ...tab, component: markRaw(tab.component) }
    const idx = dock.tabs.findIndex(t => t.id === tab.id)

    if (idx !== -1) {
      // Сохраняем текущие реактивные пропсы, если вкладка перерегистрируется
      dock.tabs[idx] = { ...safeTab, props: { ...dock.tabs[idx]!.props, ...safeTab.props } }
    } else {
      dock.tabs.push(safeTab)
    }
  }

  const unregisterTab = (side: DockSide, tabId: string) => {
    const dock = docks[side].value
    dock.tabs = dock.tabs.filter(t => t.id !== tabId)
    if (dock.activeTabId === tabId) dock.activeTabId = null
  }

  // Хелпер для страниц: сам регистрирует при маунте и сам чистит при уходе со страницы!
  const definePageTabs = (config: Partial<Record<DockSide, ToolWindow[]>>) => {
    onMounted(() => {
      Object.entries(config).forEach(([side, tabs]) => {
        tabs?.forEach(tab => registerTab(side as DockSide, tab))
      })
    })
    onScopeDispose(() => {
      Object.entries(config).forEach(([side, tabs]) => {
        tabs?.forEach(tab => unregisterTab(side as DockSide, tab.id))
      })
    })
  }

  const toggleTab = (side: DockSide, tabId: string) => {
    const dock = docks[side].value
    dock.activeTabId = dock.activeTabId === tabId ? null : tabId
  }

  const openWithContext = (side: DockSide, tabId: string, newProps: Record<string, any>) => {
    const dock = docks[side].value
    const tab = dock.tabs.find(t => t.id === tabId)
    if (tab) {
      tab.props = { ...tab.props, ...newProps }
      dock.activeTabId = tabId
    }
  }

  const resetWidth = (side: DockSide) => {
    docks[side].value.width = docks[side].value.defaultWidth
  }

  return {
    docks,
    leftDock: docks.left,
    rightDock: docks.right,
    registerTab,
    unregisterTab,
    definePageTabs,
    toggleTab,
    openWithContext,
    resetWidth
  }
}
