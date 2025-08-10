# チケット #005: 状態管理実装

## 概要
Jotaiを使用したアトム定義、コンテンツ・スケジュール・ユーザー状態管理

## 優先度
🟡 中優先度

## 詳細説明
Jotaiを使用してアプリケーション全体の状態管理を構築し、リアクティブで効率的な状態更新を実現する。

## 実装内容

### 1. 基本型定義
```typescript
// types/index.ts
export interface ImportedContent {
  id: string
  user_id: string
  original_filename?: string
  content: {
    version: string
    created_at: string
    content_id: string
    metadata: {
      title: string
      category: string
      tags: string[]
      priority: string
    }
    languages: {
      english?: {
        platforms: PlatformContent[]
      }
      japanese?: {
        platforms: PlatformContent[]
      }
    }
  }
  title?: string
  tags?: string[]
  is_favorite: boolean
  created_at: string
}

export interface PlatformContent {
  platform: string
  content: string
  metadata: {
    tokens: number
    cost: number
    model: string
    originalLength: number
    finalLength: number
  }
}

export interface PostSchedule {
  id: string
  user_id: string
  content_id?: string
  imported_content: any
  selected_language: 'english' | 'japanese'
  selected_platforms: string[]
  scheduled_time: string
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled'
  calendar_event_id?: string
  notifications_sent: string[]
  created_at: string
  updated_at: string
}

export interface UserSettings {
  language: 'en' | 'ja'
  timezone: string
  theme: 'system' | 'light' | 'dark'
  notifications: boolean
  calendar_integration: boolean
}
```

### 2. インポートコンテンツ状態管理
```typescript
// atoms/contentAtoms.ts
import { atom } from 'jotai'
import { ImportedContent } from '@/types'

// 基本状態
export const currentContentAtom = atom<ImportedContent | null>(null)
export const contentHistoryAtom = atom<ImportedContent[]>([])
export const isImportingAtom = atom<boolean>(false)
export const importErrorAtom = atom<string | null>(null)

// 派生atom
export const favoriteContentAtom = atom(
  (get) => get(contentHistoryAtom).filter(content => content.is_favorite)
)

export const recentContentAtom = atom(
  (get) => get(contentHistoryAtom)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
)

export const contentByPlatformAtom = atom(
  (get) => {
    const history = get(contentHistoryAtom)
    const byPlatform: Record<string, GeneratedContent[]> = {}
    
    history.forEach(content => {
      content.platforms.forEach(platform => {
        if (!byPlatform[platform]) {
          byPlatform[platform] = []
        }
        byPlatform[platform].push(content)
      })
    })
    
    return byPlatform
  }
)

// 書き込み専用atom
export const addToHistoryAtom = atom(
  null,
  (get, set, newContent: ImportedContent) => {
    const currentHistory = get(contentHistoryAtom)
    set(contentHistoryAtom, [newContent, ...currentHistory])
  }
)

export const toggleFavoriteAtom = atom(
  null,
  (get, set, contentId: string) => {
    const currentHistory = get(contentHistoryAtom)
    const updatedHistory = currentHistory.map(content =>
      content.id === contentId
        ? { ...content, is_favorite: !content.is_favorite }
        : content
    )
    set(contentHistoryAtom, updatedHistory)
  }
)

export const removeFromHistoryAtom = atom(
  null,
  (get, set, contentId: string) => {
    const currentHistory = get(contentHistoryAtom)
    const updatedHistory = currentHistory.filter(content => content.id !== contentId)
    set(contentHistoryAtom, updatedHistory)
  }
)
```

### 3. スケジュール状態管理
```typescript
// atoms/scheduleAtoms.ts
import { atom } from 'jotai'
import { PostSchedule } from '@/types'

// 基本状態
export const schedulesAtom = atom<PostSchedule[]>([])
export const importedContentAtom = atom<any>(null)
export const selectedLanguageAtom = atom<'english' | 'japanese'>('english')
export const selectedPlatformsAtom = atom<string[]>(['twitter'])
export const isSchedulingAtom = atom<boolean>(false)
export const schedulingErrorAtom = atom<string | null>(null)

// 派生atom
export const upcomingSchedulesAtom = atom(
  (get) => get(schedulesAtom)
    .filter(schedule => 
      schedule.status === 'scheduled' && 
      new Date(schedule.scheduled_time) > new Date()
    )
    .sort((a, b) => 
      new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    )
)

export const pastSchedulesAtom = atom(
  (get) => get(schedulesAtom)
    .filter(schedule => 
      new Date(schedule.scheduled_time) <= new Date() ||
      schedule.status !== 'scheduled'
    )
    .sort((a, b) => 
      new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
    )
)

export const schedulesByStatusAtom = atom(
  (get) => {
    const schedules = get(schedulesAtom)
    return {
      scheduled: schedules.filter(s => s.status === 'scheduled'),
      posted: schedules.filter(s => s.status === 'posted'),
      failed: schedules.filter(s => s.status === 'failed'),
      cancelled: schedules.filter(s => s.status === 'cancelled')
    }
  }
)

// 書き込みatom
export const addScheduleAtom = atom(
  null,
  (get, set, newSchedule: PostSchedule) => {
    const currentSchedules = get(schedulesAtom)
    set(schedulesAtom, [...currentSchedules, newSchedule])
  }
)

export const updateScheduleStatusAtom = atom(
  null,
  (get, set, { id, status }: { id: string; status: string }) => {
    const currentSchedules = get(schedulesAtom)
    const updatedSchedules = currentSchedules.map(schedule =>
      schedule.id === id 
        ? { ...schedule, status, updated_at: new Date().toISOString() }
        : schedule
    )
    set(schedulesAtom, updatedSchedules)
  }
)

export const removeScheduleAtom = atom(
  null,
  (get, set, scheduleId: string) => {
    const currentSchedules = get(schedulesAtom)
    const updatedSchedules = currentSchedules.filter(schedule => schedule.id !== scheduleId)
    set(schedulesAtom, updatedSchedules)
  }
)
```

### 4. ユーザー状態管理
```typescript
// atoms/userAtoms.ts
import { atom } from 'jotai'
import { User } from '@supabase/supabase-js'
import { UserSettings } from '@/types'

// 基本状態
export const userAtom = atom<User | null>(null)
export const userSettingsAtom = atom<UserSettings>({
  language: 'en',
  timezone: 'UTC',
  theme: 'system',
  notifications: true,
  calendar_integration: false
})

export const isLoadingUserAtom = atom<boolean>(false)

// 派生atom
export const userTimezoneAtom = atom(
  (get) => get(userSettingsAtom).timezone
)

export const userLanguageAtom = atom(
  (get) => get(userSettingsAtom).language
)


// localStorage 同期atom
export const userSettingsWithPersistenceAtom = atom(
  (get) => get(userSettingsAtom),
  (get, set, newSettings: Partial<UserSettings>) => {
    const currentSettings = get(userSettingsAtom)
    const updatedSettings = { ...currentSettings, ...newSettings }
    set(userSettingsAtom, updatedSettings)
    
    // localStorage に保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings))
    }
  }
)
```

### 5. UIステート管理
```typescript
// atoms/uiAtoms.ts
import { atom } from 'jotai'

// モーダル状態
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
    const currentModals = get(modalsAtoms)
    set(modalsAtom, { ...currentModals, [modalName]: false })
  }
)

// 通知状態
export const notificationsAtom = atom<Array<{
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
}>>([])

export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<typeof notificationsAtom extends atom<infer T> ? T[0] : never, 'id' | 'timestamp'>) => {
    const currentNotifications = get(notificationsAtom)
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }
    set(notificationsAtom, [...currentNotifications, newNotification])
    
    // 5秒後に自動削除
    setTimeout(() => {
      const currentNotifications = get(notificationsAtom)
      set(notificationsAtom, currentNotifications.filter(n => n.id !== newNotification.id))
    }, 5000)
  }
)

// サイドバー状態
export const sidebarOpenAtom = atom<boolean>(false)

export const toggleSidebarAtom = atom(
  null,
  (get, set) => {
    const currentState = get(sidebarOpenAtom)
    set(sidebarOpenAtom, !currentState)
  }
)
```

### 6. Jotaiプロバイダー設定
```typescript
// components/providers/JotaiProvider.tsx
'use client'
import { Provider } from 'jotai'
import { ReactNode } from 'react'

export default function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
```

## 完了条件
- [x] 全アトムファイルが作成済み
- [x] 型定義が完全に実装済み
- [x] コンテンツ状態管理が実装済み
- [x] スケジュール状態管理が実装済み
- [x] セッション状態管理が実装済み（MVP版）
- [x] UI状態管理が実装済み
- [x] Jotaiプロバイダーが設定済み
- [x] localStorage同期が実装済み

## 関連ファイル
- `atoms/*.ts`
- `types/index.ts`
- `components/providers/JotaiProvider.tsx`

## 見積もり時間
4-5時間

## 注意事項
- アトムの依存関係を適切に管理
- パフォーマンスを考慮した派生アトム設計
- localStorage同期はクライアントサイドでのみ実行
- TypeScript型安全性を重視