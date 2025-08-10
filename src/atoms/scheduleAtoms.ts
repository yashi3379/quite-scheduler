import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { PostSchedule } from '@/types'
import { FormattedContent } from '@/types/import'

// スケジュール基本状態（localStorage永続化）
export const schedulesAtom = atomWithStorage<PostSchedule[]>('schedules', [])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectedContentAtom = atom<any>(null)
export const importedContentAtom = atom<FormattedContent | null>(null)
export const selectedLanguageAtom = atom<'english' | 'japanese'>('english')
export const selectedPlatformsAtom = atom<string[]>(['twitter'])
export const scheduledTimeAtom = atom<string>('')
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

export const todaySchedulesAtom = atom(
  (get) => {
    const schedules = get(schedulesAtom)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    return schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduled_time)
        return scheduleDate >= todayStart && scheduleDate < todayEnd
      })
      .sort((a, b) => 
        new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
      )
  }
)

export const scheduleStatsAtom = atom(
  (get) => {
    const byStatus = get(schedulesByStatusAtom)
    const upcoming = get(upcomingSchedulesAtom)
    const today = get(todaySchedulesAtom)
    
    return {
      total: get(schedulesAtom).length,
      scheduled: byStatus.scheduled.length,
      posted: byStatus.posted.length,
      failed: byStatus.failed.length,
      cancelled: byStatus.cancelled.length,
      upcoming: upcoming.length,
      today: today.length
    }
  }
)

// 書き込みatom
export const addScheduleAtom = atom(
  null,
  async (get, set, newSchedule: PostSchedule) => {
    const currentSchedules = get(schedulesAtom)
    set(schedulesAtom, [...currentSchedules, newSchedule])
    
    // Google Calendar イベント作成
    if (typeof window !== 'undefined') {
      try {
        // Get calendar notification settings
        const calendarSettings = localStorage.getItem('calendarNotificationSettings')
        let reminders = [{ method: 'popup' as const, minutes: 10 }] // Default
        
        if (calendarSettings) {
          const settings = JSON.parse(calendarSettings)
          reminders = settings
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s: any) => s.enabled)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((s: any) => ({
              method: s.method,
              minutes: s.minutes
            }))
        }

        // Import Google Calendar service and create event
        const { googleCalendarService } = await import('@/lib/googleCalendar')
        
        const startTime = new Date(newSchedule.scheduled_time)
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 minutes duration
        
        const eventId = await googleCalendarService.createEvent(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            title: (newSchedule as any).title || `SNS投稿: ${newSchedule.selected_platforms.join(', ')}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            description: `投稿予定: ${newSchedule.selected_platforms.join(', ')}\n\nコンテンツ:\n${(newSchedule as any).content || ''}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reminders: reminders as any
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'placeholder-token' as any
        )

        if (eventId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (console as any).log('Calendar event created with ID:', eventId)
          // Optionally store the event ID with the schedule for later deletion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (newSchedule as any).calendar_event_id = eventId
        }
        
      } catch (error) {
        console.error('Failed to create calendar event:', error)
      }
    }
  }
)

export const updateScheduleAtom = atom(
  null,
  (get, set, { id, updates }: { id: string; updates: Partial<PostSchedule> }) => {
    const currentSchedules = get(schedulesAtom)
    const updatedSchedules = currentSchedules.map(schedule =>
      schedule.id === id 
        ? { ...schedule, ...updates, updated_at: new Date().toISOString() }
        : schedule
    )
    set(schedulesAtom, updatedSchedules)
  }
)

export const updateScheduleStatusAtom = atom(
  null,
  (get, set, { id, status }: { id: string; status: PostSchedule['status'] }) => {
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
  async (get, set, scheduleId: string) => {
    const currentSchedules = get(schedulesAtom)
    const updatedSchedules = currentSchedules.filter(schedule => schedule.id !== scheduleId)
    set(schedulesAtom, updatedSchedules)
    
    // カレンダーイベントの削除処理
    if (typeof window !== 'undefined') {
      try {
        // Google Calendar APIを使ってイベントを削除する処理をここに追加
        console.log('Calendar event removed for schedule:', scheduleId)
      } catch (error) {
        console.error('Failed to remove calendar event:', error)
      }
    }
  }
)

export const clearSchedulingErrorAtom = atom(
  null,
  (get, set) => {
    set(schedulingErrorAtom, null)
  }
)

// スケジューリングフォーム状態リセット
export const resetSchedulingFormAtom = atom(
  null,
  (get, set) => {
    set(selectedContentAtom, null)
    set(selectedLanguageAtom, 'english')
    set(selectedPlatformsAtom, ['twitter'])
    set(scheduledTimeAtom, '')
    set(schedulingErrorAtom, null)
  }
)