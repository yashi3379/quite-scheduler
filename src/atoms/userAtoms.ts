import { atom } from 'jotai'

// ユーザー設定の型定義
interface UserSettings {
  notifications: boolean
  language: 'en' | 'ja'
  timezone: string
  theme: 'light' | 'dark' | 'system'
  autoSave: boolean
}

// デフォルトのユーザー設定
const defaultUserSettings: UserSettings = {
  notifications: false,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: 'system',
  autoSave: true
}

// ユーザー設定のatom
export const userSettingsAtom = atom<UserSettings>(defaultUserSettings)

// ローカルストレージとの同期を行うatom
export const userSettingsWithPersistenceAtom = atom(
  (get) => get(userSettingsAtom),
  (get, set, newSettings: Partial<UserSettings>) => {
    const currentSettings = get(userSettingsAtom)
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.error('Failed to save user settings to localStorage:', error)
      }
    }
    
    set(userSettingsAtom, updatedSettings)
  }
)

// ローカルストレージからユーザー設定を読み込むatom
export const loadUserSettingsAtom = atom(
  null,
  (get, set) => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          set(userSettingsAtom, { ...defaultUserSettings, ...parsedSettings })
        }
      } catch (error) {
        console.error('Failed to load user settings from localStorage:', error)
        set(userSettingsAtom, defaultUserSettings)
      }
    }
  }
)

// 通知許可状態のatom
export const notificationPermissionAtom = atom<'default' | 'granted' | 'denied'>('default')

// 通知サブスクリプション状態のatom
export const notificationSubscriptionAtom = atom<boolean>(false)

// アプリの状態atomも追加
export const appStateAtom = atom({
  isOnline: true,
  lastSyncTime: null as string | null,
  pendingSyncs: 0
})