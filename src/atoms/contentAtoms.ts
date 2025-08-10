import { atom } from 'jotai'
import { ImportedContent } from '@/types'

// インポートコンテンツ基本状態
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
    const byPlatform: Record<string, ImportedContent[]> = {}
    
    history.forEach(content => {
      const languages = content.content.languages
      Object.values(languages).forEach(lang => {
        if (lang?.platforms) {
          lang.platforms.forEach(platform => {
            if (!byPlatform[platform.platform]) {
              byPlatform[platform.platform] = []
            }
            byPlatform[platform.platform].push(content)
          })
        }
      })
    })
    
    return byPlatform
  }
)

export const contentStatsAtom = atom(
  (get) => {
    const history = get(contentHistoryAtom)
    const favorites = get(favoriteContentAtom)
    
    return {
      total: history.length,
      favorites: favorites.length,
      recent: Math.min(history.length, 10)
    }
  }
)

// 書き込み専用atom
export const addToHistoryAtom = atom(
  null,
  (get, set, newContent: ImportedContent) => {
    const currentHistory = get(contentHistoryAtom)
    // 重複チェック
    const exists = currentHistory.some(content => content.content_id === newContent.content_id)
    if (!exists) {
      set(contentHistoryAtom, [newContent, ...currentHistory])
    }
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

export const updateContentAtom = atom(
  null,
  (get, set, { id, updates }: { id: string; updates: Partial<ImportedContent> }) => {
    const currentHistory = get(contentHistoryAtom)
    const updatedHistory = currentHistory.map(content =>
      content.id === id ? { ...content, ...updates } : content
    )
    set(contentHistoryAtom, updatedHistory)
  }
)

export const clearImportErrorAtom = atom(
  null,
  (get, set) => {
    set(importErrorAtom, null)
  }
)