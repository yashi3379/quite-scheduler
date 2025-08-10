'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { 
  contentHistoryAtom, 
  toggleFavoriteAtom,
  removeFromHistoryAtom 
} from '@/atoms/contentAtoms'
import {
  schedulesAtom,
  removeScheduleAtom,
  updateScheduleStatusAtom
} from '@/atoms/scheduleAtoms'

interface HistoryFilters {
  search: string
  type: 'all' | 'content' | 'scheduled'
  platform: string
  language: string
  dateRange: 'all' | 'week' | 'month' | 'year'
  status: 'all' | 'scheduled' | 'posted' | 'failed' | 'cancelled'
  favorites: boolean
}

interface UnifiedHistoryItem {
  id: string
  type: 'content' | 'scheduled'
  title: string
  created_at: string
  platforms: string[]
  languages: string[]
  status?: string
  scheduled_time?: string
  is_favorite?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export default function UnifiedHistory() {
  const t = useTranslations('history')
  const tCommon = useTranslations('common')
  const [contentHistory] = useAtom(contentHistoryAtom)
  const [schedules] = useAtom(schedulesAtom)
  const [, toggleFavorite] = useAtom(toggleFavoriteAtom)
  const [, removeFromHistory] = useAtom(removeFromHistoryAtom)
  const [, removeSchedule] = useAtom(removeScheduleAtom)
  const [, updateScheduleStatus] = useAtom(updateScheduleStatusAtom)
  const [isClient, setIsClient] = useState(false)
  
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    type: 'all',
    platform: 'all',
    language: 'all',
    dateRange: 'all',
    status: 'all',
    favorites: false
  })
  
  const [selectedItem, setSelectedItem] = useState<UnifiedHistoryItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<UnifiedHistoryItem | null>(null)

  // Fix hydration error by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Combine content and schedules into unified items
  const unifiedItems: UnifiedHistoryItem[] = [
    // Import content items
    ...contentHistory.map(content => ({
      id: content.id,
      type: 'content' as const,
      title: content.title || content.content.metadata.title,
      created_at: content.created_at,
      platforms: Object.values(content.content.languages || {})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .flatMap(lang => (lang as any).platforms.map((p: any) => p.platform))
        .filter((platform, index, arr) => arr.indexOf(platform) === index),
      languages: Object.keys(content.content.languages || {}),
      is_favorite: content.is_favorite,
      data: content
    })),
    // Scheduled posts
    ...schedules.map(schedule => ({
      id: schedule.id,
      type: 'scheduled' as const,
      title: schedule.imported_content?.metadata?.title || 'Scheduled Post',
      created_at: schedule.created_at || schedule.scheduled_time,
      platforms: schedule.selected_platforms,
      languages: [schedule.selected_language],
      status: schedule.status,
      scheduled_time: schedule.scheduled_time,
      data: schedule
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredItems = unifiedItems.filter(item => {
    // Search filter
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    
    // Type filter
    if (filters.type !== 'all' && item.type !== filters.type) {
      return false
    }
    
    // Platform filter
    if (filters.platform !== 'all' && !item.platforms.includes(filters.platform)) {
      return false
    }
    
    // Language filter
    if (filters.language !== 'all' && !item.languages.includes(filters.language)) {
      return false
    }
    
    // Status filter (only for scheduled items)
    if (filters.status !== 'all') {
      if (item.type === 'scheduled' && item.status !== filters.status) {
        return false
      }
      if (item.type === 'content') {
        return false // Content items don't have status, so filter them out when status is not 'all'
      }
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const itemDate = new Date(item.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
      
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
    
    // Favorites filter
    if (filters.favorites && !item.is_favorite) {
      return false
    }
    
    return true
  })

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(filteredItems, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const today = new Date()
    const dateStr = isClient ? today.toISOString().split('T')[0] : 'export'
    const exportFileDefaultName = `unified-history-${dateStr}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleDeleteItem = (item: UnifiedHistoryItem) => {
    setItemToDelete(item)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'content') {
        removeFromHistory(itemToDelete.id)
      } else {
        removeSchedule(itemToDelete.id)
      }
      setItemToDelete(null)
      setIsDeleteModalOpen(false)
    }
  }

  const handleStatusChange = (scheduleId: string, newStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateScheduleStatus({ id: scheduleId, status: newStatus as any })
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵'
    }
    return icons[platform as keyof typeof icons] || '📱'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    return type === 'content' ? '📚' : '📅'
  }

  const formatDate = (dateString: string) => {
    if (!isClient) return dateString
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    if (!isClient) return dateString
    return new Date(dateString).toLocaleString()
  }

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                📋 {t('completeHistory')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>{tCommon('loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 {t('completeHistory')}
            </span>
            <div className="flex gap-2">
              <Button onClick={handleExportHistory} variant="secondary" size="sm">
                📥 {t('export')}
              </Button>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                {filteredItems.length} {t('items')}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <Input
              placeholder={t('search')}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <select
              value={filters.type}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allTypes')}</option>
              <option value="content">{t('content')}</option>
              <option value="scheduled">{t('scheduled')}</option>
            </select>
            
            <select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allPlatforms')}</option>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="threads">Threads</option>
            </select>
            
            <select
              value={filters.language}
              onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allLanguages')}</option>
              <option value="english">English</option>
              <option value="japanese">日本語</option>
            </select>
            
            <select
              value={filters.status}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="scheduled">{t('scheduled')}</option>
              <option value="posted">{t('posted')}</option>
              <option value="failed">{t('failed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
            
            <select
              value={filters.dateRange}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allTime')}</option>
              <option value="week">{t('pastWeek')}</option>
              <option value="month">{t('pastMonth')}</option>
              <option value="year">{t('pastYear')}</option>
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.favorites}
                onChange={(e) => setFilters(prev => ({ ...prev, favorites: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{t('favorites')}</span>
            </label>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{t('noItemsFound')}</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <h3 className="font-medium">{item.title}</h3>
                      <div className="flex gap-1">
                        {item.platforms.map(platform => (
                          <span key={platform} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {getPlatformIcon(platform)} {platform}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {item.languages.map(lang => (
                          <span key={lang} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {lang === 'english' ? '🇺🇸' : '🇯🇵'}
                          </span>
                        ))}
                      </div>
                      {item.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        <div>{formatDate(item.created_at)}</div>
                        {item.scheduled_time && item.scheduled_time !== item.created_at && (
                          <div className="text-xs">
                            {t('scheduledTime')} {formatDateTime(item.scheduled_time)}
                          </div>
                        )}
                      </div>
                      {item.type === 'content' && (
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-1 rounded hover:bg-gray-200 ${
                            item.is_favorite ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                        >
                          {item.is_favorite ? '⭐' : '☆'}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        👁️
                      </button>
                      {item.type === 'scheduled' && item.status === 'scheduled' && (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="text-xs px-2 py-1 border rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="scheduled">{t('scheduled')}</option>
                          <option value="posted">{t('posted')}</option>
                          <option value="failed">{t('failed')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {item.type === 'content' 
                      ? `${t('imported')} ${item.languages.length} ${t('languagesFor')} ${item.platforms.length} ${t('platformsCount')}`
                      : `${t('scheduledFor')} ${item.platforms.length} ${t('platformsCount')}`
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} className="max-w-4xl">
        {selectedItem && (
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              {getTypeIcon(selectedItem.type)} {selectedItem.title}
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedItem.type === 'content' ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.entries(selectedItem.data.content.languages).map(([lang, langData]: [string, any]) => (
                  <div key={lang} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      {lang === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
                    </h4>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {langData.platforms.map((platform: any, idx: number) => (
                      <div key={idx} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {getPlatformIcon(platform.platform)} {platform.platform}
                          </span>
                          <span className="text-xs text-gray-500">
                            {platform.metadata.finalLength} {t('chars')}
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
                ))
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong>{t('status')}:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedItem.status!)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div>
                      <strong>{t('scheduledTime')}</strong> {formatDateTime(selectedItem.scheduled_time!)}
                    </div>
                    <div>
                      <strong>{t('platforms')}:</strong> {selectedItem.platforms.join(', ')}
                    </div>
                    <div>
                      <strong>{t('language')}:</strong> {selectedItem.languages[0]}
                    </div>
                  </div>
                  {selectedItem.data.imported_content && (
                    <div className="bg-gray-50 rounded p-3">
                      <strong className="block mb-2">{t('contentPreview')}:</strong>
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(selectedItem.data.imported_content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setSelectedItem(null)} className="flex-1">
                {t('close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">{t('confirmDelete')}</h3>
          <p className="text-gray-600 mb-4">
            {t('deleteConfirmMessage', { type: itemToDelete?.type === 'content' ? t('content') : t('scheduled') })}
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsDeleteModalOpen(false)} 
              variant="secondary" 
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="danger" 
              className="flex-1"
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}