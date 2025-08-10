'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import PlatformContent from '@/components/copy/PlatformContent'
import CopyStatusIndicator from '@/components/copy/CopyStatusIndicator'
import { updateCopyStatus } from '@/lib/copy'

interface CopyPageContentProps {
  schedule: {
    id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imported_content: any
    selected_language: string
    selected_platforms: string[]
    scheduled_time: string
    copy_status?: Record<string, string>
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

export default function CopyPageContent({ schedule, content }: CopyPageContentProps) {
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>(
    schedule.copy_status || {}
  )
  const [activePlatform, setActivePlatform] = useState<string>(
    schedule.selected_platforms[0]
  )
  const [notification, setNotification] = useState<string | null>(null)

  const scheduledTime = new Date(schedule.scheduled_time)
  const isPostTime = new Date() >= scheduledTime
  const timeUntilPost = scheduledTime.getTime() - new Date().getTime()
  const minutesUntilPost = Math.max(0, Math.floor(timeUntilPost / (1000 * 60)))

  // 選択された言語のコンテンツを取得
  // contentがnullの場合はscheduleからコンテンツを取得
  const contentData = content || schedule.imported_content
  
  console.log('Debug CopyPageContent:', {
    schedule,
    content,
    contentData,
    selected_language: schedule.selected_language
  })
  
  const languageContent = contentData?.languages?.[schedule.selected_language]
  const platformContents = languageContent?.platforms || []

  // 選択されたプラットフォームのコンテンツのみフィルタ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableContents = platformContents.filter((platform: any) =>
    schedule.selected_platforms.includes(platform.platform)
  )

  // データが不完全な場合のエラーハンドリング
  if (!contentData || !languageContent || availableContents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Not Available</h1>
          <p className="text-gray-600 mb-4">
            The content for this schedule is not available or incomplete.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-left text-sm">
            <p><strong>Schedule ID:</strong> {schedule.id}</p>
            <p><strong>Language:</strong> {schedule.selected_language}</p>
            <p><strong>Platforms:</strong> {schedule.selected_platforms.join(', ')}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = async (platform: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      
      // ローカル状態更新
      const newStatus = { ...copyStatus, [platform]: 'copied' }
      setCopyStatus(newStatus)
      
      // サーバー状態更新
      await updateCopyStatus(schedule.id, platform, 'copied')
      
      // 成功通知
      setNotification(`✅ ${platform} content copied!`)
      setTimeout(() => setNotification(null), 3000)
      
      // バイブレーション（モバイル対応）
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
    } catch (error) {
      console.error('Copy failed:', error)
      setNotification(`❌ Copy failed. Please select and copy manually.`)
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵',
      linkedin: '💼',
      facebook: '📘'
    }
    return icons[platform] || '📱'
  }

  const getLanguageFlag = (language: string) => {
    return language === 'english' ? '🇺🇸' : '🇯🇵'
  }

  const getLanguageName = (language: string) => {
    return language === 'english' ? 'English' : '日本語'
  }

  const getAllCopiedCount = () => {
    return schedule.selected_platforms.filter(platform => copyStatus[platform] === 'copied').length
  }

  const getTotalPlatforms = () => {
    return schedule.selected_platforms.length
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 通知 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in">
          <div className="text-sm font-medium">{notification}</div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              📋 {contentData?.metadata?.title || 'Content Copy'}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                {getLanguageFlag(schedule.selected_language)}
                {getLanguageName(schedule.selected_language)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                🕒 {scheduledTime.toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                📊 {getAllCopiedCount()}/{getTotalPlatforms()} copied
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {isPostTime ? (
              <div>
                <Badge variant="success" className="mb-2 text-sm">
                  🟢 Post Time!
                </Badge>
                <div className="text-xs text-gray-500">
                  Ready to post now
                </div>
              </div>
            ) : (
              <div>
                <Badge variant="warning" className="mb-2 text-sm">
                  ⏰ {minutesUntilPost}m until post
                </Badge>
                <div className="text-xs text-gray-500">
                  Prepare content
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プラットフォームタブ */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {schedule.selected_platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activePlatform === platform
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <span>{getPlatformIcon(platform)}</span>
              <span className="capitalize">{platform}</span>
              <CopyStatusIndicator status={copyStatus[platform]} />
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-6">
        {availableContents
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((platform: any) => platform.platform === activePlatform)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((platform: any, index: number) => (
            <PlatformContent
              key={`${platform.platform}-${index}`}
              platform={platform}
              onCopy={handleCopy}
              copyStatus={copyStatus[platform.platform]}
            />
          ))}
      </div>

      {/* プログレス情報 */}
      {getTotalPlatforms() > 1 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Copy Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.selected_platforms.map((platform) => (
                  <div 
                    key={platform}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      copyStatus[platform] === 'copied'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getPlatformIcon(platform)}</span>
                      <span className="capitalize font-medium">{platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyStatusIndicator status={copyStatus[platform]} />
                      {copyStatus[platform] === 'copied' && (
                        <span className="text-xs text-green-600">Ready</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium">
                    {getAllCopiedCount()}/{getTotalPlatforms()} platforms copied
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(getAllCopiedCount() / getTotalPlatforms()) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フッター情報 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="text-sm text-gray-500 space-y-1">
            <p>💡 <strong>How to use:</strong> Tap any content area or button to copy</p>
            <p>🔄 <strong>Next step:</strong> Paste the copied content into each platform</p>
            <p>📱 <strong>Mobile tip:</strong> Long press to select text manually if needed</p>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>Content ID: <code className="bg-gray-100 px-1 rounded">{contentData?.content_id || schedule.id}</code></p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <p>Generated: {new Date(contentData?.created_at || (schedule as any).created_at || new Date()).toLocaleString()}</p>
            <p>Access: Token-based secure link</p>
          </div>
        </div>
      </div>
    </div>
  )
}