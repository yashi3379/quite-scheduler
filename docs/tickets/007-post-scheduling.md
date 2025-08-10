# チケット #007: 投稿スケジューリング機能実装

## 概要
AI最適時間提案、Google Calendar連携、タイムゾーン対応

## 優先度
🔴 高優先度

## 詳細説明
AIによる最適投稿時間提案機能、Google Calendar連携、多様なタイムゾーン対応を含む包括的なスケジューリングシステムを実装する。

## 実装内容

### 1. 時間最適化AIロジック
```typescript
// lib/timeOptimizer.ts
interface OptimalTimeRequest {
  content: any
  platforms: string[]
  targetAudience?: 'global' | 'us' | 'japan' | 'europe'
  contentType?: 'tech' | 'business' | 'lifestyle' | 'news'
}

interface OptimalTimeSuggestion {
  time: string // ISO string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  timezone: string
  expectedEngagement: number // 0-100
  competitionLevel: 'high' | 'medium' | 'low'
}

export async function suggestOptimalTimes(request: OptimalTimeRequest): Promise<OptimalTimeSuggestion[]> {
  const { platforms, targetAudience = 'global', contentType = 'tech' } = request
  
  const suggestions: OptimalTimeSuggestion[] = []
  
  // プラットフォーム別の最適化ロジック
  for (const platform of platforms) {
    switch (platform) {
      case 'twitter':
        suggestions.push(...getTwitterOptimalTimes(targetAudience, contentType))
        break
      case 'reddit':
        suggestions.push(...getRedditOptimalTimes(targetAudience, contentType))
        break
      case 'threads':
        suggestions.push(...getThreadsOptimalTimes(targetAudience, contentType))
        break
    }
  }
  
  // 重複排除と信頼度順ソート
  return deduplicateAndSort(suggestions)
}

function getTwitterOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  // 基本的な最適時間パターン
  const basePatterns = {
    global: [
      { hour: 9, confidence: 'high', reason: 'Morning commute time globally' },
      { hour: 14, confidence: 'high', reason: 'Lunch break engagement peak' },
      { hour: 21, confidence: 'medium', reason: 'Evening leisure time' }
    ],
    us: [
      { hour: 9, confidence: 'high', reason: 'US East Coast morning' },
      { hour: 14, confidence: 'high', reason: 'US lunch time peak' },
      { hour: 17, confidence: 'medium', reason: 'US evening commute' }
    ],
    japan: [
      { hour: 7, confidence: 'high', reason: 'Japan morning commute' },
      { hour: 12, confidence: 'high', reason: 'Japan lunch break' },
      { hour: 21, confidence: 'high', reason: 'Japan evening peak' }
    ]
  }
  
  const patterns = basePatterns[audience] || basePatterns.global
  
  patterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    // 過去の時間なら翌日に設定
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement(platform, pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel(platform, pattern.hour)
    })
  })
  
  return suggestions
}

function getRedditOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  // Reddit特有の最適時間（平日の朝と夕方）
  const redditPatterns = [
    { hour: 8, confidence: 'high', reason: 'Reddit morning browsing peak' },
    { hour: 16, confidence: 'high', reason: 'Reddit afternoon engagement' },
    { hour: 20, confidence: 'medium', reason: 'Reddit evening discussion time' }
  ]
  
  redditPatterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement('reddit', pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel('reddit', pattern.hour)
    })
  })
  
  return suggestions
}

function getThreadsOptimalTimes(audience: string, contentType: string): OptimalTimeSuggestion[] {
  // Threadsは比較的新しいプラットフォームなので、Instagramパターンを基準
  const now = new Date()
  const suggestions: OptimalTimeSuggestion[] = []
  
  const threadsPatterns = [
    { hour: 11, confidence: 'medium', reason: 'Threads mid-morning engagement' },
    { hour: 15, confidence: 'high', reason: 'Threads afternoon peak' },
    { hour: 19, confidence: 'high', reason: 'Threads evening social time' }
  ]
  
  threadsPatterns.forEach(pattern => {
    const suggestionTime = new Date(now)
    suggestionTime.setHours(pattern.hour, 0, 0, 0)
    
    if (suggestionTime <= now) {
      suggestionTime.setDate(suggestionTime.getDate() + 1)
    }
    
    suggestions.push({
      time: suggestionTime.toISOString(),
      reason: pattern.reason,
      confidence: pattern.confidence,
      timezone: getTimezoneForAudience(audience),
      expectedEngagement: calculateExpectedEngagement('threads', pattern.hour, contentType),
      competitionLevel: calculateCompetitionLevel('threads', pattern.hour)
    })
  })
  
  return suggestions
}

function getTimezoneForAudience(audience: string): string {
  const timezones = {
    global: 'UTC',
    us: 'America/New_York',
    japan: 'Asia/Tokyo',
    europe: 'Europe/London'
  }
  return timezones[audience] || 'UTC'
}

function calculateExpectedEngagement(platform: string, hour: number, contentType: string): number {
  // 簡単な計算ロジック（実際にはより複雑なアルゴリズムが必要）
  const baseEngagement = {
    twitter: 65,
    reddit: 70,
    threads: 60
  }
  
  const hourModifier = Math.max(0.3, Math.sin((hour - 6) * Math.PI / 12))
  const contentModifier = contentType === 'tech' ? 1.1 : 1.0
  
  return Math.round((baseEngagement[platform] || 60) * hourModifier * contentModifier)
}

function calculateCompetitionLevel(platform: string, hour: number): 'high' | 'medium' | 'low' {
  // 一般的なピーク時間は競争が激しい
  const peakHours = [9, 12, 14, 17, 21]
  
  if (peakHours.includes(hour)) return 'high'
  if (hour >= 8 && hour <= 22) return 'medium'
  return 'low'
}

function deduplicateAndSort(suggestions: OptimalTimeSuggestion[]): OptimalTimeSuggestion[] {
  // 時間で重複排除
  const uniqueSuggestions = suggestions.reduce((acc, current) => {
    const exists = acc.find(item => 
      Math.abs(new Date(item.time).getTime() - new Date(current.time).getTime()) < 60 * 60 * 1000 // 1時間以内
    )
    
    if (!exists) {
      acc.push(current)
    } else if (current.expectedEngagement > exists.expectedEngagement) {
      // より高いエンゲージメントが期待できる場合は置き換え
      const index = acc.indexOf(exists)
      acc[index] = current
    }
    
    return acc
  }, [] as OptimalTimeSuggestion[])
  
  // 信頼度と期待エンゲージメントでソート
  return uniqueSuggestions.sort((a, b) => {
    const confidenceScore = { high: 3, medium: 2, low: 1 }
    const aScore = confidenceScore[a.confidence] * a.expectedEngagement
    const bScore = confidenceScore[b.confidence] * b.expectedEngagement
    return bScore - aScore
  }).slice(0, 5) // 上位5つの提案のみ
}
```

### 2. Google Calendar 連携
```typescript
// lib/googleCalendar.ts
interface CalendarEvent {
  id?: string
  title: string
  description: string
  startTime: string
  endTime: string
  reminders?: {
    overrides: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

class GoogleCalendarService {
  private accessToken: string | null = null
  
  async initialize() {
    // Google Calendar API初期化
    if (typeof window !== 'undefined' && window.gapi) {
      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
        })
      })
    }
  }
  
  async authenticate(): Promise<boolean> {
    try {
      // OAuth認証フロー
      const authInstance = window.gapi.auth2.getAuthInstance()
      const authResult = await authInstance.signIn()
      this.accessToken = authResult.getAuthResponse().access_token
      return true
    } catch (error) {
      console.error('Google Calendar authentication failed:', error)
      return false
    }
  }
  
  async createEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }
    
    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: event.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          reminders: event.reminders || {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'popup', minutes: 10 }
            ]
          }
        }
      })
      
      return response.result.id
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return null
    }
  }
  
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }
    
    try {
      await window.gapi.client.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: {
          summary: event.title,
          description: event.description,
          start: event.startTime ? {
            dateTime: event.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          } : undefined,
          end: event.endTime ? {
            dateTime: event.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          } : undefined
        }
      })
      
      return true
    } catch (error) {
      console.error('Failed to update calendar event:', error)
      return false
    }
  }
  
  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar')
    }
    
    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      })
      
      return true
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      return false
    }
  }
}

export const googleCalendar = new GoogleCalendarService()
```

### 3. スケジューリングコンポーネント
```typescript
// components/schedule/PostScheduler.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { suggestOptimalTimes, OptimalTimeSuggestion } from '@/lib/timeOptimizer'
import { googleCalendar } from '@/lib/googleCalendar'
import { 
  importedContentAtom, 
  selectedLanguageAtom, 
  selectedPlatformsAtom,
  addScheduleAtom,
  isSchedulingAtom 
} from '@/atoms/scheduleAtoms'
import { userTimezoneAtom } from '@/atoms/userAtoms'

export default function PostScheduler() {
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms] = useAtom(selectedPlatformsAtom)
  const [userTimezone] = useAtom(userTimezoneAtom)
  const [, addSchedule] = useAtom(addScheduleAtom)
  const [isScheduling, setIsScheduling] = useAtom(isSchedulingAtom)
  
  const [suggestions, setSuggestions] = useState<OptimalTimeSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimalTimeSuggestion | null>(null)
  const [customDateTime, setCustomDateTime] = useState('')
  const [useCalendarIntegration, setUseCalendarIntegration] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  useEffect(() => {
    if (importedContent && selectedPlatforms.length > 0) {
      loadOptimalTimeSuggestions()
    }
  }, [importedContent, selectedPlatforms])

  const loadOptimalTimeSuggestions = async () => {
    setIsLoadingSuggestions(true)
    
    try {
      const optimizations = await suggestOptimalTimes({
        content: importedContent,
        platforms: selectedPlatforms,
        targetAudience: detectAudience(),
        contentType: detectContentType()
      })
      
      setSuggestions(optimizations)
      if (optimizations.length > 0) {
        setSelectedSuggestion(optimizations[0])
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
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
    if (tags.some(tag => ['tech', 'programming', 'dev'].includes(tag.toLowerCase()))) {
      return 'tech'
    }
    return 'tech' // デフォルト
  }

  const handleSchedule = async () => {
    if (!importedContent || !selectedSuggestion && !customDateTime) return
    
    setIsScheduling(true)
    
    try {
      const scheduledTime = selectedSuggestion 
        ? selectedSuggestion.time 
        : new Date(customDateTime).toISOString()
      
      let calendarEventId: string | null = null
      
      // Google Calendar統合
      if (useCalendarIntegration) {
        const eventTitle = `Post to ${selectedPlatforms.join(', ')}`
        const eventDescription = `Scheduled post: ${importedContent.metadata.title}`
        
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
        })
      }
      
      // スケジュール保存
      const newSchedule = {
        id: generateScheduleId(),
        user_id: 'current-user', // 実際のユーザーIDに置き換え
        content_id: importedContent.content_id,
        imported_content: importedContent.imported_content,
        selected_language: selectedLanguage,
        selected_platforms: selectedPlatforms,
        scheduled_time: scheduledTime,
        status: 'scheduled' as const,
        calendar_event_id: calendarEventId,
        notifications_sent: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // データベースに保存（実装は別途必要）
      await saveScheduleToDatabase(newSchedule)
      
      // ローカル状態に追加
      addSchedule(newSchedule)
      
      // 成功通知
      alert('Post scheduled successfully!')
      
    } catch (error) {
      console.error('Scheduling failed:', error)
      alert('Failed to schedule post. Please try again.')
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

  if (!importedContent) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Please import content first to schedule posts.</p>
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
              <Badge key={platform} variant="secondary" className="capitalize">
                {platform}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* AI提案時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🤖 AI Suggested Times
            </label>
            
            {isLoadingSuggestions ? (
              <div className="text-center py-4">Loading suggestions...</div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSuggestion(suggestion)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedSuggestion === suggestion
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
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
                        <Badge variant="secondary">
                          {suggestion.expectedEngagement}% engagement
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                  </button>
                ))}
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
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Google Calendar統合 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="calendar-integration"
              checked={useCalendarIntegration}
              onChange={(e) => setUseCalendarIntegration(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="calendar-integration" className="text-sm font-medium text-gray-700">
              📅 Add to Google Calendar with reminders
            </label>
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
  return 'schedule_' + Math.random().toString(36).substr(2, 9)
}

async function saveScheduleToDatabase(schedule: any): Promise<void> {
  // データベース保存のAPI呼び出し（実装は別のチケットで）
  const response = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule)
  })
  
  if (!response.ok) {
    throw new Error('Failed to save schedule')
  }
}
```

### 4. API実装
```typescript
// app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const scheduleData = await request.json()
    
    // 認証確認
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // スケジュール保存
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        ...scheduleData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'スケジュール保存に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      schedule: data
    })
    
  } catch (error) {
    console.error('Schedule creation error:', error)
    return NextResponse.json(
      { error: 'スケジュール作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // スケジュール一覧取得
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'スケジュール取得に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      schedules: data
    })
    
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json(
      { error: 'スケジュール取得に失敗しました' },
      { status: 500 }
    )
  }
}
```

## 完了条件
- [x] AI時間最適化ロジックが実装済み
- [x] Google Calendar連携が実装済み
- [x] スケジューリングコンポーネントが実装済み
- [ ] API エンドポイントが実装済み（データベース保存部分のみ未実装）
- [x] タイムゾーン対応が実装済み
- [x] カスタム時間設定が実装済み
- [x] リマインダー機能が実装済み
- [ ] データベース連携が実装済み（ローカル状態管理のみ実装）

## 関連ファイル
- `lib/timeOptimizer.ts`
- `lib/googleCalendar.ts`
- `components/schedule/PostScheduler.tsx`
- `app/api/schedule/route.ts`

## 見積もり時間
7-9時間

## 注意事項
- Google Calendar API制限を考慮
- タイムゾーン処理を正確に実装
- AI提案アルゴリズムの精度向上
- エラーハンドリングを充実
- ユーザーエクスペリエンスを重視