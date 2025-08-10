// Googleカレンダーのイベント作成URLを生成する関数（認証不要）

export interface CalendarEventData {
  title: string
  description: string
  startTime: string // ISO string
  endTime: string // ISO string
  location?: string
}

export function createGoogleCalendarUrl(eventData: CalendarEventData): string {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  
  // 時刻をGoogleカレンダー形式に変換 (YYYYMMDDTHHMMSSZ)
  const formatDateTime = (isoString: string): string => {
    return new Date(isoString).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    details: eventData.description,
    dates: `${formatDateTime(eventData.startTime)}/${formatDateTime(eventData.endTime)}`,
    location: eventData.location || '',
    sprop: 'name:Quite Scheduler'
  })

  return `${baseUrl}?${params.toString()}`
}

export function createScheduleCalendarEvent(
  contentTitle: string,
  scheduledTime: string,
  platforms: string[],
  language: string,
  copyUrl: string
): CalendarEventData {
  const startTime = new Date(scheduledTime)
  const endTime = new Date(startTime.getTime() + 15 * 60 * 1000) // 15分後

  const platformEmojis: Record<string, string> = {
    twitter: '🐦',
    reddit: '📮',
    threads: '🧵'
  }

  const platformList = platforms
    .map(platform => `${platformEmojis[platform] || '📱'} ${platform}`)
    .join(', ')

  const languageFlag = language === 'japanese' ? '🇯🇵' : '🇺🇸'

  const title = `📅 Scheduled Post: ${contentTitle}`
  
  const description = `🚀 Time to post your scheduled content!

📝 Content: ${contentTitle}
🌐 Language: ${languageFlag} ${language === 'japanese' ? '日本語' : 'English'}
📱 Platforms: ${platformList}
⏰ Scheduled Time: ${startTime.toLocaleString()}

📋 Copy Content URL:
${copyUrl}

📌 Instructions:
1. Click the copy URL above
2. Copy content for each platform
3. Post to your selected platforms
4. Mark as completed

Created by Quite Scheduler 🎯`

  return {
    title,
    description,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    location: 'Quite Scheduler'
  }
}