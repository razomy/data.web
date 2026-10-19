// composables/useLayout.ts
import { useState } from '#app'

export interface SidebarConfig {
  isOpen: boolean
  width: number
  minWidth: number
  maxWidth: number
  rail: boolean // Режим "только иконки" (для левого)
  persistent: boolean // Не закрывать при клике вне (на мобилках)
}

export const useAppLayout = () => {
  // Конфигурация левого сайдбара
  const leftDrawer = useState<SidebarConfig>('layout-left-drawer', () => ({
    isOpen: true,
    width: 260,
    minWidth: 180,
    maxWidth: 450,
    rail: false,
    persistent: false,
  }))

  // Конфигурация правого сайдбара (инспектор/детали)
  const rightDrawer = useState<SidebarConfig>('layout-right-drawer', () => ({
    isOpen: false,
    width: 320,
    minWidth: 240,
    maxWidth: 600,
    rail: false,
    persistent: false,
  }))

  // Хелперы для управления в рантайме
  const toggleLeft = () => { leftDrawer.value.isOpen = !leftDrawer.value.isOpen }
  const toggleRight = () => { rightDrawer.value.isOpen = !rightDrawer.value.isOpen }

  const setLeftConfig = (config: Partial<SidebarConfig>) => {
    leftDrawer.value = { ...leftDrawer.value, ...config }
  }

  const setRightConfig = (config: Partial<SidebarConfig>) => {
    rightDrawer.value = { ...rightDrawer.value, ...config }
  }

  return {
    leftDrawer,
    rightDrawer,
    toggleLeft,
    toggleRight,
    setLeftConfig,
    setRightConfig,
  }
}
