'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  importedContentAtom, 
  selectedLanguageAtom, 
  selectedPlatformsAtom,
  addScheduleAtom
} from '@/atoms/scheduleAtoms'
import { PostSchedule } from '@/types'
import { createGoogleCalendarUrl, createScheduleCalendarEvent } from '@/lib/googleCalendarUrl'
import { googleCalendarService } from '@/lib/googleCalendar'
import { useGoogleAuth } from '@/components/auth/GoogleAuthProvider'

interface SimplePostSchedulerProps {
  locale: string
}

export default function SimplePostScheduler({ locale }: SimplePostSchedulerProps) {
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms, setSelectedPlatforms] = useAtom(selectedPlatformsAtom)
  const [, addSchedule] = useAtom(addScheduleAtom)
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(true)
  const { isAuthenticated, googleAccessToken } = useGoogleAuth()

  if (!importedContent) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No content imported yet. Please import content first.
          </p>
          <Button onClick={() => window.location.href = `/${locale}/import`}>
            📥 Import Content
          </Button>
        </CardContent>
      </Card>
    )
  }

  const availableLanguages = importedContent.available_languages
  const availablePlatforms = importedContent.available_platforms

  const getContentForLanguageAndPlatform = (language: string, platform: string) => {
    const langData = importedContent.imported_content.languages[language as keyof typeof importedContent.imported_content.languages]
    const platformData = langData?.platforms.find(p => p.platform === platform)
    return platformData
  }

  const handleSchedule = async () => {
    if (!scheduledDateTime || selectedPlatforms.length === 0) {
      alert('Please select date/time and at least one platform')
      return
    }

    setIsScheduling(true)
    
    try {
      const newSchedule: PostSchedule = {
        id: `schedule_${Date.now()}`,
        session_id: 'current_session', // In MVP, we use a simple session ID
        content_id: importedContent.content_id,
        imported_content: importedContent.imported_content,
        selected_language: selectedLanguage,
        selected_platforms: selectedPlatforms,
        scheduled_time: scheduledDateTime,
        status: 'scheduled',
        access_token: 'temp_token', // Temporary token for MVP
        copy_status: {} as Record<string, string>,
        notifications_sent: [] as string[],
        // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Not part of PostSchedule interface
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Adding schedule:', newSchedule)
      await addSchedule(newSchedule)
      console.log('Schedule added successfully')
      
      // Googleカレンダーに追加
      if (addToGoogleCalendar) {
        const copyUrl = `${window.location.origin}/${locale}/copy/${newSchedule.id}?token=simple_access`
        
        if (isAuthenticated && googleAccessToken) {
          // Google Calendar APIで実際のイベントを作成（通知設定が反映される）
          try {
            const eventStartTime = new Date(scheduledDateTime)
            const eventEndTime = new Date(eventStartTime.getTime() + 30 * 60 * 1000) // 30分後
            
            const calendarEvent = {
              title: `[SNS Post] ${importedContent.metadata.title}`,
              description: `SNS Post Schedule\n\nPlatforms: ${selectedPlatforms.join(', ')}\nLanguage: ${selectedLanguage}\n\nCopy URL: ${copyUrl}`,
              startTime: eventStartTime.toISOString(),
              endTime: eventEndTime.toISOString()
            }
            
            console.log('Creating Google Calendar event with API...')
            const eventId = await googleCalendarService.createEvent(calendarEvent, googleAccessToken)
            
            if (eventId) {
              console.log('Calendar event created successfully:', eventId)
            } else {
              console.warn('Failed to create calendar event, falling back to URL method')
              // フォールバック: 旧来のURL方式
              const legacyCalendarEvent = createScheduleCalendarEvent(
                importedContent.metadata.title,
                scheduledDateTime,
                selectedPlatforms,
                selectedLanguage,
                copyUrl
              )
              const googleCalendarUrl = createGoogleCalendarUrl(legacyCalendarEvent)
              window.open(googleCalendarUrl, '_blank')
            }
          } catch (error) {
            console.error('Failed to create calendar event via API:', error)
            // フォールバック: 旧来のURL方式
            const legacyCalendarEvent = createScheduleCalendarEvent(
              importedContent.metadata.title,
              scheduledDateTime,
              selectedPlatforms,
              selectedLanguage,
              copyUrl
            )
            const googleCalendarUrl = createGoogleCalendarUrl(legacyCalendarEvent)
            window.open(googleCalendarUrl, '_blank')
          }
        } else {
          // 認証していない場合は旧来のURL方式
          const legacyCalendarEvent = createScheduleCalendarEvent(
            importedContent.metadata.title,
            scheduledDateTime,
            selectedPlatforms,
            selectedLanguage,
            copyUrl
          )
          const googleCalendarUrl = createGoogleCalendarUrl(legacyCalendarEvent)
          window.open(googleCalendarUrl, '_blank')
        }
      }
      
      // 成功メッセージを表示してから自動的にダッシュボードに遷移
      const calendarMessage = addToGoogleCalendar ? 
        (isAuthenticated ? '\n\n📅 Google Calendar event created with custom reminders!' : '\n\n📅 Google Calendar event opened in new tab!') : ''
      
      alert(`✅ Successfully scheduled for ${new Date(scheduledDateTime).toLocaleString()} on ${selectedPlatforms.join(', ')}${calendarMessage}`)
      
      // 少し待ってからダッシュボードに遷移
      setTimeout(() => {
        window.location.href = `/${locale}/dashboard`
      }, 1000)
      
    } catch (error) {
      console.error('Failed to schedule:', error)
      alert('❌ Failed to schedule post. Please try again.')
    } finally {
      setIsScheduling(false)
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
    <div className="space-y-6">
      {/* インポートしたコンテンツの概要 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Imported Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="default">
              📅 {new Date(importedContent.created_at).toLocaleDateString()}
            </Badge>
            <Badge variant="default">
              🏷️ {importedContent.metadata.category}
            </Badge>
            <Badge variant="default">
              💬 {importedContent.metadata.title}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 言語選択 */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Select Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {availableLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang as 'english' | 'japanese')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* プラットフォーム選択 */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Select Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availablePlatforms.map(platform => {
              const content = getContentForLanguageAndPlatform(selectedLanguage, platform)
              const isSelected = selectedPlatforms.includes(platform)
              
              return (
                <button
                  key={platform}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                    } else {
                      setSelectedPlatforms(prev => [...prev, platform])
                    }
                  }}
                  disabled={!content}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    !content
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {getPlatformIcon(platform)} {platform}
                    </span>
                    {content && (
                      <Badge variant="default">
                        {content.metadata.finalLength} chars
                      </Badge>
                    )}
                  </div>
                  {content ? (
                    <p className="text-sm text-gray-600 truncate">
                      {content.content}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No content available for {selectedLanguage}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 日時選択 */}
      <Card>
        <CardHeader>
          <CardTitle>⏰ Schedule Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="googleCalendar"
                checked={addToGoogleCalendar}
                onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="googleCalendar" className="text-sm text-gray-700">
                📅 Add to Google Calendar (with copy URL)
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              💡 Select when you want to post this content
            </p>
          </div>
        </CardContent>
      </Card>

      {/* スケジュール実行 */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Confirm Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPlatforms.length > 0 && scheduledDateTime && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Schedule Summary</h4>
                <p className="text-sm text-blue-700">
                  📅 <strong>Time:</strong> {new Date(scheduledDateTime).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700">
                  🌐 <strong>Language:</strong> {selectedLanguage === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
                </p>
                <p className="text-sm text-blue-700">
                  📱 <strong>Platforms:</strong> {selectedPlatforms.map(p => `${getPlatformIcon(p)} ${p}`).join(', ')}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSchedule}
                disabled={!scheduledDateTime || selectedPlatforms.length === 0 || isScheduling}
                className="flex-1"
                size="lg"
              >
                {isScheduling ? 'Scheduling...' : '📅 Schedule Post'}
              </Button>
              <Button
                onClick={() => window.location.href = `/${locale}/import`}
                variant="secondary"
                size="lg"
              >
                ← Back to Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}