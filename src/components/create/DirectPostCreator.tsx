'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { schedulesAtom } from '@/atoms/scheduleAtoms'
import { contentHistoryAtom } from '@/atoms/contentAtoms'

interface Platform {
  id: 'twitter' | 'reddit' | 'threads'
  name: string
  icon: string
  maxLength: number
  placeholder: string
}

interface DirectPost {
  id: string
  title: string
  platform: Platform['id']
  content: string
  scheduledDate: string
  scheduledTime: string
  language: 'en' | 'ja'
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled'
  createdAt: string
  tags: string[]
}

export default function DirectPostCreator({ locale }: { locale: string }) {
  const t = useTranslations('create')
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [schedules, setSchedules] = useAtom(schedulesAtom)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contentHistory, setContentHistory] = useAtom(contentHistoryAtom)

  const platforms: Platform[] = [
    {
      id: 'twitter',
      name: 'Twitter (X)',
      icon: '🐦',
      maxLength: 280,
      placeholder: t('twitterPlaceholder') || 'What\'s happening?'
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: '🔴',
      maxLength: 40000,
      placeholder: t('redditPlaceholder') || 'Share your thoughts...'
    },
    {
      id: 'threads',
      name: 'Threads',
      icon: '🧵',
      maxLength: 500,
      placeholder: t('threadsPlaceholder') || 'Start a thread...'
    }
  ]

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(platforms[0])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Notify parent about form changes for navigation guard
  useEffect(() => {
    const hasChanges = Boolean(
      title.trim() || 
      content.trim() || 
      scheduledDate || 
      scheduledTime || 
      tags.trim()
    )

    // Dispatch custom event to notify layout
    const event = new CustomEvent('create-form-changed', {
      detail: { hasChanges }
    })
    window.dispatchEvent(event)
  }, [title, content, scheduledDate, scheduledTime, tags])

  const handlePlatformChange = (platformId: Platform['id']) => {
    const platform = platforms.find(p => p.id === platformId)
    if (platform) {
      setSelectedPlatform(platform)
      // Clear content if it's too long for the new platform
      if (content.length > platform.maxLength) {
        setContent(content.substring(0, platform.maxLength))
      }
    }
  }

  const handleContentChange = (value: string) => {
    if (value.length <= selectedPlatform.maxLength) {
      setContent(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim() || !scheduledDate || !scheduledTime) {
      alert(t('fillAllFields') || 'すべてのフィールドを入力してください')
      return
    }

    setIsSubmitting(true)

    try {
      const postId = `direct_${Date.now()}`
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const now = new Date()

      // Create direct post object
      const directPost: DirectPost = {
        id: postId,
        title: title.trim(),
        platform: selectedPlatform.id,
        content: content.trim(),
        scheduledDate,
        scheduledTime,
        language: locale as 'en' | 'ja',
        status: 'scheduled',
        createdAt: now.toISOString(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }

      // Add to schedules
      setSchedules(prev => [...prev, {
        id: postId,
        contentId: postId,
        scheduledTime: scheduledDateTime.toISOString(),
        status: 'scheduled',
        platform: selectedPlatform.id,
        language: locale as 'en' | 'ja',
        title: title.trim(),
        createdAt: now.toISOString(),
        content: {
          [selectedPlatform.id]: {
            [locale]: content.trim()
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any])

      // Add to content history
      setContentHistory(prev => [...prev, {
        id: postId,
        title: title.trim(),
        contentId: postId,
        platforms: [selectedPlatform.id],
        languages: [locale as 'en' | 'ja'],
        importedAt: now.toISOString(),
        isFavorite: false,
        content: {
          [selectedPlatform.id]: {
            [locale]: content.trim()
          }
        },
        metadata: {
          totalCharacters: content.length,
          totalCost: 0,
          model: 'direct-input',
          tags: directPost.tags
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any])

      // Reset form
      setTitle('')
      setContent('')
      setScheduledDate('')
      setScheduledTime('')
      setTags('')

      // Clear the unsaved changes state
      const event = new CustomEvent('create-form-changed', {
        detail: { hasChanges: false }
      })
      window.dispatchEvent(event)

      alert(t('postScheduled') || '投稿がスケジュールされました')
      router.push(`/${locale}/dashboard`)

    } catch (error) {
      console.error('Failed to create direct post:', error)
      alert(t('schedulingError') || 'スケジューリングに失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 {t('selectPlatform') || 'プラットフォーム選択'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformChange(platform.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedPlatform.id === platform.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <h3 className="font-semibold">{platform.name}</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {t('maxCharacters', { count: platform.maxLength }) || 
                   `最大 ${platform.maxLength} 文字`}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✏️ {t('createPost') || '投稿作成'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                {t('postTitle') || '投稿タイトル'} *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder') || '投稿のタイトルを入力...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="content" className="text-sm font-medium text-gray-700">
                  {t('postContent') || '投稿内容'} *
                </label>
                <span className={`text-sm ${
                  content.length > selectedPlatform.maxLength * 0.9
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}>
                  {content.length} / {selectedPlatform.maxLength}
                </span>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={selectedPlatform.placeholder}
                rows={selectedPlatform.id === 'reddit' ? 8 : 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
              />
              {content.length > selectedPlatform.maxLength * 0.9 && (
                <p className="text-sm text-orange-600 mt-1">
                  {t('nearCharacterLimit') || '文字数制限に近づいています'}
                </p>
              )}
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scheduledDate') || '投稿予定日'} *
                </label>
                <input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scheduledTime') || '投稿予定時刻'} *
                </label>
                <input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Tags (Optional) */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                {t('tags') || 'タグ'} ({t('optional') || '任意'})
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('tagsPlaceholder') || 'タグをカンマ区切りで入力 (例: マーケティング, SNS, スケジュール)'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim() || !scheduledDate || !scheduledTime}
                className="flex-1"
              >
                {isSubmitting ? 
                  (t('scheduling') || 'スケジュール中...') : 
                  `📅 ${t('schedulePost') || '投稿をスケジュール'}`
                }
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="px-6"
              >
                {t('cancel') || 'キャンセル'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      {content.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👁️ {t('preview') || 'プレビュー'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{selectedPlatform.icon}</span>
                <span className="font-medium">{selectedPlatform.name}</span>
                {scheduledDate && scheduledTime && (
                  <span className="text-sm text-gray-500 ml-auto">
                    📅 {scheduledDate} {scheduledTime}
                  </span>
                )}
              </div>
              {title && (
                <h4 className="font-semibold mb-2">{title}</h4>
              )}
              <p className="whitespace-pre-wrap">{content}</p>
              {tags && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}