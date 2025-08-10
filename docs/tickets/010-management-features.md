# チケット #010: 管理機能・最終調整

## 概要
コンテンツ履歴、設定画面、エラーハンドリング、パフォーマンス最適化

## 優先度
🟡 中優先度

## 詳細説明
アプリケーションの最終調整として、コンテンツ履歴管理、包括的な設定画面、堅牢なエラーハンドリング、パフォーマンス最適化を実装する。

## 実装内容

### 1. インポートコンテンツ履歴管理
```typescript
// components/content/ContentHistory.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  contentHistoryAtom, 
  favoriteContentAtom,
  toggleFavoriteAtom,
  removeFromHistoryAtom 
} from '@/atoms/contentAtoms'

interface HistoryFilters {
  search: string
  platform: string
  language: string
  dateRange: 'all' | 'week' | 'month' | 'year'
  favorites: boolean
}

export default function ContentHistory() {
  const [contentHistory] = useAtom(contentHistoryAtom)
  const [favoriteContent] = useAtom(favoriteContentAtom)
  const [, toggleFavorite] = useAtom(toggleFavoriteAtom)
  const [, removeFromHistory] = useAtom(removeFromHistoryAtom)
  
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    platform: 'all',
    language: 'all',
    dateRange: 'all',
    favorites: false
  })
  
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<string | null>(null)

  const filteredContent = contentHistory.filter(content => {
    // 検索フィルタ
    if (filters.search && !content.title?.toLowerCase().includes(filters.search.toLowerCase()) && 
        !content.content.metadata.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    
    // プラットフォームフィルタ
    if (filters.platform !== 'all') {
      const availablePlatforms = Object.values(content.content.languages || {})
        .flatMap(lang => lang.platforms.map(p => p.platform))
      if (!availablePlatforms.includes(filters.platform)) {
        return false
      }
    }
    
    // 言語フィルタ
    if (filters.language !== 'all') {
      const availableLanguages = Object.keys(content.content.languages || {})
      if (!availableLanguages.includes(filters.language)) {
        return false
      }
    }
    
    // 期間フィルタ
    if (filters.dateRange !== 'all') {
      const contentDate = new Date(content.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (filters.dateRange) {
        case 'week':
          if (diffDays > 7) return false
          break
        case 'month':
          if (diffDays > 30) return false
          break
        case 'year':
          if (diffDays > 365) return false
          break
      }
    }
    
    // お気に入りフィルタ
    if (filters.favorites && !content.is_favorite) {
      return false
    }
    
    return true
  })

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(filteredContent, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `content-history-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleDeleteContent = (contentId: string) => {
    setContentToDelete(contentId)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (contentToDelete) {
      removeFromHistory(contentToDelete)
      setContentToDelete(null)
      setIsDeleteModalOpen(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵'
    }
    return icons[platform] || '📱'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📚 Content History
            </span>
            <div className="flex gap-2">
              <Button onClick={handleExportHistory} variant="secondary" size="sm">
                📥 Export
              </Button>
              <Badge variant="default">
                {filteredContent.length} items
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search keywords..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="threads">Threads</option>
            </select>
            
            <select
              value={filters.language}
              onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Languages</option>
              <option value="english">English</option>
              <option value="japanese">日本語</option>
            </select>
            
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.favorites}
                onChange={(e) => setFilters(prev => ({ ...prev, favorites: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm">Favorites only</span>
            </label>
          </div>

          {/* コンテンツリスト */}
          <div className="space-y-4">
            {filteredContent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No content found matching your filters.</p>
              </div>
            ) : (
              filteredContent.map((content) => (
                <div key={content.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{content.title || content.content.metadata.title}</h3>
                      <div className="flex gap-1">
                        {Object.values(content.content.languages || {})
                          .flatMap(lang => lang.platforms.map(p => p.platform))
                          .filter((platform, index, arr) => arr.indexOf(platform) === index)
                          .map(platform => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {getPlatformIcon(platform)} {platform}
                            </Badge>
                          ))}
                      </div>
                      <div className="flex gap-1">
                        {Object.keys(content.content.languages || {}).map(lang => (
                          <Badge key={lang} variant="default" className="text-xs">
                            {lang === 'english' ? '🇺🇸' : '🇯🇵'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => toggleFavorite(content.id)}
                        className={`p-1 rounded hover:bg-gray-200 ${
                          content.is_favorite ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                      >
                        {content.is_favorite ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={() => setSelectedContent(content)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Imported {Object.keys(content.content.languages).length} language(s) 
                    for {Object.values(content.content.languages || {}).flatMap(lang => lang.platforms).length} platform(s)
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* コンテンツプレビューモーダル */}
      <Modal isOpen={!!selectedContent} onClose={() => setSelectedContent(null)}>
        {selectedContent && (
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">{selectedContent.title || selectedContent.content.metadata.title}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(selectedContent.content.languages).map(([lang, langData]: [string, any]) => (
                <div key={lang} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {lang === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
                  </h4>
                  {langData.platforms.map((platform: any, idx: number) => (
                    <div key={idx} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {getPlatformIcon(platform.platform)} {platform.platform}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {platform.metadata.finalLength} chars
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <pre className="whitespace-pre-wrap font-mono">
                          {platform.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setSelectedContent(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this content? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsDeleteModalOpen(false)} 
              variant="secondary" 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="danger" 
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
```

### 2. 設定画面
```typescript
// components/settings/SettingsPage.tsx
'use client'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { userSettingsWithPersistenceAtom } from '@/atoms/userAtoms'
import NotificationSettings from '@/components/notifications/NotificationSettings'

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useAtom(userSettingsWithPersistenceAtom)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSaveSettings = async () => {
    setIsSaving(true)
    
    try {
      // サーバーに設定を保存
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify(userSettings)
      })
      
      if (response.ok) {
        setSaveMessage('Settings saved successfully!')
      } else {
        setSaveMessage('Failed to save settings. Please try again.')
      }
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(userSettings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `quite-scheduler-settings-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setUserSettings({
        language: 'en',
        timezone: 'UTC',
        theme: 'system',
        notifications: true,
        calendar_integration: false
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 基本設定 */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={userSettings.language}
                onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value as 'en' | 'ja' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={userSettings.timezone}
                onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex gap-2">
              {['system', 'light', 'dark'].map(theme => (
                <button
                  key={theme}
                  onClick={() => setUserSettings(prev => ({ ...prev, theme: theme as any }))}
                  className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                    userSettings.theme === theme
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 通知設定 */}
      <NotificationSettings />

      {/* 統合設定 */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Google Calendar</h3>
              <p className="text-sm text-gray-600">
                Add scheduled posts to your calendar
              </p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={userSettings.calendar_integration}
                onChange={(e) => setUserSettings(prev => ({ 
                  ...prev, 
                  calendar_integration: e.target.checked 
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 設定管理 */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Settings Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSaveSettings}
              loading={isSaving}
              className="flex-1"
            >
              💾 Save Settings
            </Button>
            <Button 
              onClick={exportSettings}
              variant="secondary"
              className="flex-1"
            >
              📥 Export Settings
            </Button>
            <Button 
              onClick={resetSettings}
              variant="danger"
              className="flex-1"
            >
              🔄 Reset to Default
            </Button>
          </div>
          
          {saveMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              saveMessage.includes('success') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function getAccessToken(): Promise<string> {
  // Supabaseからアクセストークンを取得
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ''
}
```

### 3. エラーハンドリング
```typescript
// components/shared/ErrorBoundary.tsx
'use client'
import { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // エラーログをサーバーに送信
    this.logErrorToService(error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  async logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-red-600">
                ❌ Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We're sorry! An unexpected error occurred. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-sm text-red-600 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  🔄 Reload Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="secondary"
                  className="flex-1"
                >
                  🏠 Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 4. パフォーマンス最適化
```typescript
// lib/performance.ts
import { useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

// 画像遅延読み込み
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(element)
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [callback, options])
}

// デバウンス検索
export function useDebounceSearch(
  searchTerm: string,
  delay: number,
  callback: (term: string) => void
) {
  const debouncedCallback = useCallback(
    debounce((term: string) => callback(term), delay),
    [callback, delay]
  )

  useEffect(() => {
    debouncedCallback(searchTerm)
    return () => debouncedCallback.cancel()
  }, [searchTerm, debouncedCallback])
}

// メモリ使用量監視
export function useMemoryMonitoring() {
  useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576)
        
        if (usedMB > 100) { // 100MB以上使用時に警告
          console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`)
        }
      }

      const interval = setInterval(checkMemory, 30000) // 30秒ごと
      return () => clearInterval(interval)
    }
  }, [])
}

// バンドルサイズ最適化
export const LazyContentGenerator = lazy(() => import('@/components/content/ContentGenerator'))
export const LazyContentHistory = lazy(() => import('@/components/content/ContentHistory'))
export const LazyPostScheduler = lazy(() => import('@/components/schedule/PostScheduler'))
```

### 5. 総合ダッシュボード
```typescript
// components/dashboard/Dashboard.tsx
'use client'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  recentContentAtom, 
  favoriteContentAtom 
} from '@/atoms/contentAtoms'
import { 
  upcomingSchedulesAtom, 
  schedulesByStatusAtom 
} from '@/atoms/scheduleAtoms'

export default function Dashboard() {
  const [recentContent] = useAtom(recentContentAtom)
  const [favoriteContent] = useAtom(favoriteContentAtom)
  const [upcomingSchedules] = useAtom(upcomingSchedulesAtom)
  const [schedulesByStatus] = useAtom(schedulesByStatusAtom)

  const stats = {
    totalContent: recentContent.length,
    favorites: favoriteContent.length,
    scheduled: schedulesByStatus.scheduled.length,
    posted: schedulesByStatus.posted.length
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                📝
              </div>
              <div>
                <p className="text-sm text-gray-600">Imported Content</p>
                <p className="text-2xl font-bold">{stats.totalContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                ⭐
              </div>
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-2xl font-bold">{stats.favorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                📅
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                ✅
              </div>
              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="text-2xl font-bold">{stats.posted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近のコンテンツ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📚 Recent Content</span>
              <Button size="sm" variant="ghost">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.slice(0, 5).map(content => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{content.title || content.content.metadata.title}</p>
                    <div className="flex gap-1 mt-1">
                      {Object.values(content.content.languages || {})
                        .flatMap(lang => lang.platforms.map(p => p.platform))
                        .filter((platform, index, arr) => arr.indexOf(platform) === index)
                        .map(platform => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(content.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 近日予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>⏰ Upcoming Posts</span>
              <Button size="sm" variant="ghost">Schedule More</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedules.slice(0, 5).map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex gap-1 mb-1">
                      {schedule.selected_platforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(schedule.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={schedule.status === 'scheduled' ? 'success' : 'default'}>
                    {schedule.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-24 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">📥</span>
              <span>Import Content</span>
            </Button>
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">📋</span>
              <span>View History</span>
            </Button>
            <Button variant="secondary" className="h-24 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">📅</span>
              <span>Schedule Post</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 完了条件
- [ ] インポートコンテンツ履歴管理が完全実装済み
- [ ] 包括的な設定画面が実装済み
- [ ] エラーバウンダリが実装済み
- [ ] パフォーマンス最適化が実装済み
- [ ] 総合ダッシュボードが実装済み
- [ ] エラーログ収集が実装済み
- [ ] メモリ監視が実装済み
- [ ] 遅延読み込みが実装済み

## 関連ファイル
- `components/content/ContentHistory.tsx`
- `components/settings/SettingsPage.tsx`
- `components/shared/ErrorBoundary.tsx`
- `components/dashboard/Dashboard.tsx`
- `lib/performance.ts`

## 見積もり時間
6-8時間

## 注意事項
- ユーザビリティを最優先に設計
- パフォーマンス指標を継続監視
- エラーハンドリングを網羅的に実装
- データエクスポート機能を充実
- アクセシビリティ要件を満たす