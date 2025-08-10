import { atom } from 'jotai'

// セッション状態管理（MVP版）
export const sessionIdAtom = atom<string>('')
export const isSessionValidAtom = atom<boolean>(false)
export const isValidatingSessionAtom = atom<boolean>(true)

// セッション設定
export const sessionSettingsAtom = atom({
  language: 'en' as 'en' | 'ja',
  timezone: 'UTC',
  theme: 'system' as 'system' | 'light' | 'dark',
  notifications: true,
  calendar_integration: false
})

// 派生atom
export const sessionTimezoneAtom = atom(
  (get) => get(sessionSettingsAtom).timezone
)

export const sessionLanguageAtom = atom(
  (get) => get(sessionSettingsAtom).language
)

// localStorage同期設定atom
export const sessionSettingsWithPersistenceAtom = atom(
  (get) => get(sessionSettingsAtom),
  (get, set, newSettings: Partial<typeof sessionSettingsAtom>) => {
    const currentSettings = get(sessionSettingsAtom)
    const updatedSettings = { ...currentSettings, ...newSettings }
    set(sessionSettingsAtom, updatedSettings)
    
    // localStorage に保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('quite_scheduler_settings', JSON.stringify(updatedSettings))
    }
  }
)