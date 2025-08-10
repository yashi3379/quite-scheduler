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
  // Simplified service that works entirely through server-side API
  // No client-side Google API initialization needed
  
  // Get saved notification settings from localStorage
  private getSavedNotificationSettings(): Array<{method: 'popup' | 'email', minutes: number}> {
    try {
      const saved = localStorage.getItem('calendarNotificationSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((s: any) => s.enabled)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((s: any) => ({
            method: s.method as 'popup' | 'email',
            minutes: s.minutes
          }))
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error)
    }
    
    // デフォルトの通知設定
    return [
      { method: 'popup', minutes: 30 },
      { method: 'popup', minutes: 10 }
    ]
  }
  
  async authenticate(): Promise<boolean> {
    // This is now handled by Supabase Auth in GoogleAuthProvider
    // This method is kept for backward compatibility
    console.warn('GoogleCalendarService.authenticate() is deprecated. Use GoogleAuthProvider instead.')
    return false
  }

  // Alias for authenticate method
  async signIn(): Promise<boolean> {
    console.warn('GoogleCalendarService.signIn() is deprecated. Use GoogleAuthProvider instead.')
    return this.authenticate()
  }

  // Update default reminders for calendar - now uses server-side proxy directly
  async updateDefaultReminders(reminders: Array<{method: 'popup' | 'email', minutes: number}>, accessToken: string): Promise<boolean> {
    if (!accessToken) {
      throw new Error('Access token required for calendar operations')
    }
    
    try {
      console.log('Updating calendar default reminders:', reminders)
      
      // サーバーサイドAPIを経由してカレンダー設定を更新
      const response = await fetch('/api/google-calendar/events', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          eventId: 'default', // For calendar settings
          reminders
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Calendar settings update failed:', errorData)
        throw new Error(errorData.error || 'Failed to update calendar settings')
      }

      console.log('Calendar default reminders updated successfully')
      return true
    } catch (error) {
      console.error('Failed to update default reminders:', error)
      return false
    }
  }
  
  async createEvent(event: CalendarEvent, accessToken: string): Promise<string | null> {
    if (!accessToken) {
      throw new Error('Access token required for calendar operations')
    }
    
    try {
      // 保存された通知設定を取得、または指定されたリマインダーを使用
      const reminders = event.reminders ? event.reminders.overrides : this.getSavedNotificationSettings()
      
      console.log('Creating calendar event with reminders:', reminders)
      
      const response = await fetch('/api/google-calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          event: {
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            reminders
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create calendar event')
      }

      const result = await response.json()
      return result.eventId || null
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return null
    }
  }
  
  // These methods are deprecated and kept for backward compatibility
  // All calendar operations should now be done through the server-side API
  async updateEvent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    eventId: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: Partial<CalendarEvent>
  ): Promise<boolean> {
    console.warn('GoogleCalendarService.updateEvent() is deprecated. Use server-side API directly.')
    return false
  }
  
  async deleteEvent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    eventId: string
  ): Promise<boolean> {
    console.warn('GoogleCalendarService.deleteEvent() is deprecated. Use server-side API directly.')
    return false
  }
  
  isAuthenticated(): boolean {
    console.warn('GoogleCalendarService.isAuthenticated() is deprecated. Use GoogleAuthProvider context.')
    return false
  }
}

// グローバルに利用できるインスタンス
export const googleCalendar = new GoogleCalendarService()

// エイリアス for backward compatibility
export const googleCalendarService = googleCalendar

// 型定義をエクスポート
export type { CalendarEvent }