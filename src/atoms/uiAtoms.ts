import { atom } from 'jotai'

// モーダル状態管理
export const modalsAtom = atom<Record<string, boolean>>({})

export const openModalAtom = atom(
  null,
  (get, set, modalName: string) => {
    const currentModals = get(modalsAtom)
    set(modalsAtom, { ...currentModals, [modalName]: true })
  }
)

export const closeModalAtom = atom(
  null,
  (get, set, modalName: string) => {
    const currentModals = get(modalsAtom)
    set(modalsAtom, { ...currentModals, [modalName]: false })
  }
)

export const isModalOpenAtom = (modalName: string) => atom(
  (get) => get(modalsAtom)[modalName] || false
)

import type { NotificationItem } from '@/types'

export const notificationsAtom = atom<NotificationItem[]>([])

export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const currentNotifications = get(notificationsAtom)
    const newNotification: NotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    set(notificationsAtom, [...currentNotifications, newNotification])
    
    // 5秒後に自動削除
    setTimeout(() => {
      const current = get(notificationsAtom)
      set(notificationsAtom, current.filter(n => n.id !== newNotification.id))
    }, 5000)
  }
)

export const removeNotificationAtom = atom(
  null,
  (get, set, notificationId: string) => {
    const currentNotifications = get(notificationsAtom)
    set(notificationsAtom, currentNotifications.filter(n => n.id !== notificationId))
  }
)

export const clearAllNotificationsAtom = atom(
  null,
  (get, set) => {
    set(notificationsAtom, [])
  }
)

// サイドバー・ナビゲーション状態
export const sidebarOpenAtom = atom<boolean>(false)
export const mobileMenuOpenAtom = atom<boolean>(false)

export const toggleSidebarAtom = atom(
  null,
  (get, set) => {
    const currentState = get(sidebarOpenAtom)
    set(sidebarOpenAtom, !currentState)
  }
)

export const toggleMobileMenuAtom = atom(
  null,
  (get, set) => {
    const currentState = get(mobileMenuOpenAtom)
    set(mobileMenuOpenAtom, !currentState)
  }
)

// ローディング状態管理
export const loadingStatesAtom = atom<Record<string, boolean>>({})

export const setLoadingAtom = atom(
  null,
  (get, set, { key, loading }: { key: string; loading: boolean }) => {
    const currentStates = get(loadingStatesAtom)
    set(loadingStatesAtom, { ...currentStates, [key]: loading })
  }
)

export const isLoadingAtom = (key: string) => atom(
  (get) => get(loadingStatesAtom)[key] || false
)

// テーマ状態管理
export const themeAtom = atom<'system' | 'light' | 'dark'>('system')

export const setThemeAtom = atom(
  null,
  (get, set, theme: 'system' | 'light' | 'dark') => {
    set(themeAtom, theme)
    
    // localStorage に保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('quite_scheduler_theme', theme)
    }
  }
)

// エラー状態管理
export const errorStatesAtom = atom<Record<string, string | null>>({})

export const setErrorAtom = atom(
  null,
  (get, set, { key, error }: { key: string; error: string | null }) => {
    const currentStates = get(errorStatesAtom)
    set(errorStatesAtom, { ...currentStates, [key]: error })
  }
)

export const clearErrorAtom = atom(
  null,
  (get, set, key: string) => {
    const currentStates = get(errorStatesAtom)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: removed, ...rest } = currentStates
    set(errorStatesAtom, rest)
  }
)

export const getErrorAtom = (key: string) => atom(
  (get) => get(errorStatesAtom)[key] || null
)