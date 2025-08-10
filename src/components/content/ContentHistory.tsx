'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return icons[platform as keyof typeof icons] || '📱'
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
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                {filteredContent.length} items
              </span>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                            <span key={platform} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {getPlatformIcon(platform)} {platform}
                            </span>
                          ))}
                      </div>
                      <div className="flex gap-1">
                        {Object.keys(content.content.languages || {}).map(lang => (
                          <span key={lang} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {lang === 'english' ? '🇺🇸' : '🇯🇵'}
                          </span>
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
      <Modal isOpen={!!selectedContent} onClose={() => setSelectedContent(null)} className="max-w-4xl">
        {selectedContent && (
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">{selectedContent.title || selectedContent.content.metadata.title}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {Object.entries(selectedContent.content.languages).map(([lang, langData]: [string, any]) => (
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