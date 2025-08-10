'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { suggestOptimalTimes, OptimalTimeSuggestion } from '@/lib/timeOptimizer'
import { googleCalendar } from '@/lib/googleCalendar'
import { generateAccessURL } from '@/lib/copy'
import { 
  importedContentAtom, 
  selectedLanguageAtom, 
  selectedPlatformsAtom,
  addScheduleAtom,
  isSchedulingAtom 
} from '@/atoms/scheduleAtoms'
import { sessionTimezoneAtom } from '@/atoms/sessionAtoms'

interface PostSchedulerProps {
  locale: string
}

export default function PostScheduler({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale 
}: PostSchedulerProps) {
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms] = useAtom(selectedPlatformsAtom)
  const [userTimezone] = useAtom(sessionTimezoneAtom)
  const [, addSchedule] = useAtom(addScheduleAtom)
  const [isScheduling, setIsScheduling] = useAtom(isSchedulingAtom)
  
  const [suggestions, setSuggestions] = useState<OptimalTimeSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimalTimeSuggestion | null>(null)
  const [customDateTime, setCustomDateTime] = useState('')
  const [useCalendarIntegration, setUseCalendarIntegration] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [calendarStatus, setCalendarStatus] = useState<'not_initialized' | 'ready' | 'authenticated'>('not_initialized')

  useEffect(() => {
    if (importedContent && selectedPlatforms.length > 0) {
      loadOptimalTimeSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedContent, selectedPlatforms])

  useEffect(() => {
    // Google Calendar の初期化状態をチェック
    checkCalendarStatus()
  }, [])

  const checkCalendarStatus = async () => {
    try {
      // GoogleCalendarService methods are deprecated, using simplified status check
      setCalendarStatus('ready')
    } catch (error) {
      console.error('Calendar status check failed:', error)
    }
  }

  const loadOptimalTimeSuggestions = async () => {
    setIsLoadingSuggestions(true)
    
    try {
      const optimizations = await suggestOptimalTimes({
        content: importedContent,
        platforms: selectedPlatforms,
        targetAudience: detectAudience(),
        contentType: detectContentType() as "tech" | "business" | "lifestyle" | "news" | undefined
      })
      
      setSuggestions(optimizations)
      if (optimizations.length > 0) {
        setSelectedSuggestion(optimizations[0])
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      console.error('AI Suggestions Failed: Could not load optimal time suggestions')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const detectAudience = (): 'global' | 'us' | 'japan' | 'europe' => {
    if (selectedLanguage === 'japanese') return 'japan'
    if (userTimezone.includes('America')) return 'us'
    if (userTimezone.includes('Europe')) return 'europe'
    return 'global'
  }

  const detectContentType = (): string => {
    const tags = importedContent?.metadata.tags || []
    if (tags.some((tag: string) => ['tech', 'programming', 'dev', 'Next.js', 'AI'].includes(tag))) {
      return 'tech'
    }
    return 'tech' // デフォルト
  }

  const authenticateCalendar = async () => {
    try {
      const isAuthenticated = await googleCalendar.authenticate()
      if (isAuthenticated) {
        setCalendarStatus('authenticated')
        console.log({
          type: 'success',
          title: 'Calendar Connected',
          message: 'Google Calendar has been connected successfully'
        })
      } else {
        console.log({
          type: 'error',
          title: 'Calendar Connection Failed',
          message: 'Could not connect to Google Calendar'
        })
      }
    } catch (error) {
      console.error('Calendar authentication failed:', error)
      console.log({
        type: 'error',
        title: 'Calendar Error',
        message: 'Authentication failed. Please try again.'
      })
    }
  }

  const handleSchedule = async () => {
    if (!importedContent || (!selectedSuggestion && !customDateTime)) return
    
    setIsScheduling(true)
    
    try {
      const scheduledTime = selectedSuggestion 
        ? selectedSuggestion.time 
        : new Date(customDateTime).toISOString()
      
      let calendarEventId: string | null = null
      
      // アクセストークンとスケジュールID生成
      const scheduleId = generateScheduleId()
      const accessToken = generateAccessToken()
      
      // アクセスURL生成
      const accessURL = await generateAccessURL(scheduleId, accessToken)
      
      // Google Calendar統合
      if (useCalendarIntegration && calendarStatus === 'authenticated') {
        const eventTitle = `📱 Post to ${selectedPlatforms.join(', ')}`
        const eventDescription = `Scheduled post: ${importedContent.metadata.title}

📱 Platforms: ${selectedPlatforms.join(', ')}
🌐 Language: ${selectedLanguage === 'english' ? 'English' : 'Japanese'}

🔗 Copy content here:
${accessURL}

📝 Instructions:
1. Click the link above when it's time to post
2. Copy content for each platform
3. Paste into the respective social media platforms

⏰ Scheduled for: ${new Date(scheduledTime).toLocaleString()}`
        
        calendarEventId = await googleCalendar.createEvent({
          title: eventTitle,
          description: eventDescription,
          startTime: scheduledTime,
          endTime: new Date(new Date(scheduledTime).getTime() + 30 * 60 * 1000).toISOString(), // 30分後
          reminders: {
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'popup', minutes: 10 },
              { method: 'popup', minutes: 0 }
            ]
          }
        }, accessToken)
        
        if (!calendarEventId) {
          console.log({
            type: 'warning',
            title: 'Calendar Event Failed',
            message: 'Post scheduled but calendar event creation failed'
          })
        }
      }
      
      // スケジュール作成
      const newSchedule = {
        id: scheduleId,
        session_id: 'current-session', // 実際のセッションIDに置き換え
        content_id: importedContent.content_id,
        imported_content: importedContent.imported_content,
        selected_language: selectedLanguage,
        selected_platforms: selectedPlatforms,
        scheduled_time: scheduledTime,
        status: 'scheduled' as const,
        access_token: accessToken,
        calendar_event_id: calendarEventId || undefined,
        copy_status: {} as Record<string, string>,
        notifications_sent: [] as string[],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // TODO: データベースに保存（API実装後）
      // await saveScheduleToDatabase(newSchedule)
      
      // ローカル状態に追加
      addSchedule(newSchedule)
      
      // 成功通知
      console.log({
        type: 'success',
        title: 'Post Scheduled',
        message: `Post scheduled for ${formatTimeForDisplay(scheduledTime)}`
      })
      
      // フォームリセット
      setSelectedSuggestion(null)
      setCustomDateTime('')
      
    } catch (error) {
      console.error('Scheduling failed:', error)
      console.log({
        type: 'error',
        title: 'Scheduling Failed',
        message: 'Could not schedule post. Please try again.'
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const formatTimeForDisplay = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10) // 最低10分後
    return now.toISOString().slice(0, 16)
  }

  if (!importedContent) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Please import and select content first to schedule posts.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Schedule Posts
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {selectedLanguage === 'english' ? '🇺🇸 English' : '🇯🇵 日本語'}
            </Badge>
            {selectedPlatforms.map(platform => (
              <Badge key={platform} variant="default" className="capitalize">
                {platform}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* AI提案時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🤖 AI Suggested Optimal Times
            </label>
            
            {isLoadingSuggestions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading suggestions...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSuggestion(suggestion)
                      setCustomDateTime('')
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${ 
                      selectedSuggestion === suggestion
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {formatTimeForDisplay(suggestion.time)}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant={
                          suggestion.confidence === 'high' ? 'success' : 
                          suggestion.confidence === 'medium' ? 'warning' : 'default'
                        }>
                          {suggestion.confidence} confidence
                        </Badge>
                        <Badge variant="default">
                          {suggestion.expectedEngagement}% engagement
                        </Badge>
                        <Badge variant={
                          suggestion.competitionLevel === 'low' ? 'success' :
                          suggestion.competitionLevel === 'medium' ? 'warning' : 'danger'
                        }>
                          {suggestion.competitionLevel} competition
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No optimal time suggestions available</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadOptimalTimeSuggestions}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* カスタム時間設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ⏰ Custom Time
            </label>
            <Input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => {
                setCustomDateTime(e.target.value)
                setSelectedSuggestion(null)
              }}
              min={getMinDateTime()}
              className="w-full md:w-auto"
            />
            {customDateTime && (
              <p className="text-sm text-gray-500 mt-1">
                Scheduled for: {formatTimeForDisplay(new Date(customDateTime).toISOString())}
              </p>
            )}
          </div>

          {/* Google Calendar統合 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="calendar-integration"
                  checked={useCalendarIntegration}
                  onChange={(e) => setUseCalendarIntegration(e.target.checked)}
                  disabled={calendarStatus !== 'authenticated'}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="calendar-integration" className="text-sm font-medium text-gray-700">
                  📅 Add to Google Calendar with reminders
                </label>
              </div>
              
              {calendarStatus !== 'authenticated' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={authenticateCalendar}
                  disabled={calendarStatus === 'not_initialized'}
                >
                  Connect Calendar
                </Button>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {calendarStatus === 'not_initialized' && 'Google Calendar API not available'}
              {calendarStatus === 'ready' && 'Click "Connect Calendar" to enable calendar integration'}
              {calendarStatus === 'authenticated' && '✅ Connected to Google Calendar'}
            </div>
          </div>

          {/* スケジュールボタン */}
          <Button
            onClick={handleSchedule}
            disabled={(!selectedSuggestion && !customDateTime) || isScheduling}
            loading={isScheduling}
            className="w-full"
            size="lg"
          >
            {isScheduling ? 'Scheduling...' : '📅 Schedule Post'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function generateScheduleId(): string {
  return 'schedule_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

function generateAccessToken(): string {
  return 'token_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now()
}