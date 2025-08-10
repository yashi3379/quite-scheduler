import { supabase } from '@/lib/supabase'

export interface ScheduleWithContent {
  schedule: {
    id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imported_content: any
    selected_language: string
    selected_platforms: string[]
    scheduled_time: string
    copy_status: Record<string, string>
    access_token?: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

// MVP版：ローカル状態から検証（データベース実装は後で）
export async function validateAccessToken(
  scheduleId: string, 
  token: string
): Promise<ScheduleWithContent> {
  // TODO: 実際のデータベース実装時に置き換え
  // 現在はローカルストレージから検証
  if (typeof window === 'undefined') {
    throw new Error('Window not available for local storage access')
  }

  try {
    // ローカルストレージから該当するスケジュールを検索
    const sessionId = localStorage.getItem('quite_scheduler_session')
    if (!sessionId) {
      throw new Error('Session not found')
    }

    // 実際のスケジュールデータを取得（テスト用）
    // TODO: Supabaseから取得するように変更
    const mockSchedule = createMockScheduleForTesting(scheduleId, token)
    
    if (!mockSchedule) {
      throw new Error('Schedule not found or invalid token')
    }

    return {
      schedule: mockSchedule,
      content: mockSchedule.imported_content
    }

  } catch (error) {
    throw new Error('Invalid access token or schedule not found')
  }
}

const MOCK_CONTENT = {
  version: "1.0",
  metadata: {
    title: "サンプルコンテンツ",
    category: "generated_content",
    tags: ["サンプル", "テスト"],
    priority: "normal"
  },
  languages: {
    english: {
      platforms: [
        {
          platform: "twitter",
          content: "Sample post content for testing purposes. #sample #test",
          metadata: {
            tokens: 50,
            cost: 0.0001,
            model: "test-model",
            originalLength: 53,
            finalLength: 53
          }
        }
      ]
    },
    japanese: {
      platforms: [
        {
          platform: "twitter", 
          content: "テスト用のサンプル投稿です。 #サンプル #テスト",
          metadata: {
            tokens: 30,
            cost: 0.0001,
            model: "test-model",
            originalLength: 25,
            finalLength: 25
          }
        }
      ]
    }
  }
}

function createMockScheduleForTesting(scheduleId: string, token: string) {
  const validCombination = scheduleId.startsWith('schedule_') && token.startsWith('token_')
  
  if (!validCombination) {
    return null
  }

  return {
    id: scheduleId,
    imported_content: {
      ...MOCK_CONTENT,
      created_at: new Date().toISOString(),
      content_id: scheduleId.replace('schedule_', '')
    },
    selected_language: 'english',
    selected_platforms: ['twitter'],
    scheduled_time: new Date(Date.now() + 60000).toISOString(),
    copy_status: {},
    access_token: token
  }
}

export async function updateCopyStatus(
  scheduleId: string,
  platform: string,
  status: string
): Promise<void> {
  try {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') {
      return
    }

    // TODO: 実際のデータベース実装時に置き換え
    // 現在はローカルストレージを更新
    const sessionId = localStorage.getItem('quite_scheduler_session')
    if (!sessionId) {
      // セッションがない場合は新しく作成
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('quite_scheduler_session', newSessionId)
    }

    // ローカルストレージのステータスを更新（テスト用）
    const statusKey = `copy_status_${scheduleId}`
    const currentStatus = JSON.parse(localStorage.getItem(statusKey) || '{}')
    
    const updatedStatus = {
      ...currentStatus,
      [platform]: status,
      [`${platform}_copied_at`]: new Date().toISOString()
    }

    localStorage.setItem(statusKey, JSON.stringify(updatedStatus))

  } catch (error) {
    throw new Error('Failed to update copy status')
  }
}

export async function generateAccessURL(scheduleId: string, accessToken?: string): Promise<string> {
  // アクセストークンが提供されていない場合は生成
  const token = accessToken || `token_${Math.random().toString(36).substr(2, 16)}_${Date.now()}`
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
  return `${baseUrl}/copy/${scheduleId}?token=${token}`
}

// データベース実装版（将来用）
export async function validateAccessTokenFromDB(
  scheduleId: string, 
  token: string
): Promise<ScheduleWithContent> {
  // スケジュールとアクセストークンを検証
  const { data: schedule, error: scheduleError } = await supabase
    .from('scheduled_posts')
    .select(`
      id,
      imported_content,
      selected_language,
      selected_platforms,
      scheduled_time,
      copy_status,
      access_token
    `)
    .eq('id', scheduleId)
    .eq('access_token', token)
    .single()

  if (scheduleError || !schedule) {
    throw new Error('Invalid access token or schedule not found')
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schedule: schedule as any,
    content: schedule.imported_content
  }
}

export async function updateCopyStatusInDB(
  scheduleId: string,
  platform: string,
  status: string
): Promise<void> {
  // 現在のコピーステータスを取得
  const { data: currentSchedule } = await supabase
    .from('scheduled_posts')
    .select('copy_status')
    .eq('id', scheduleId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentStatus = (currentSchedule?.copy_status as any) || {}
  const updatedStatus = {
    ...currentStatus,
    [platform]: status,
    [`${platform}_copied_at`]: new Date().toISOString()
  }

  // ステータス更新
  const { error } = await supabase
    .from('scheduled_posts')
    .update({
      copy_status: updatedStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduleId)

  if (error) {
    throw new Error('Failed to update copy status')
  }
}