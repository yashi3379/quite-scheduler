// MVP版: セッションベースの型定義

export interface SessionData {
  id: string
  session_id: string
  timezone: string
  language: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface ImportedContent {
  id: string
  session_id: string
  original_filename?: string
  content: QuitePostContent
  content_id: string
  title?: string
  tags?: string[]
  is_favorite: boolean
  created_at: string
}

export interface QuitePostContent {
  version: string
  created_at: string
  content_id: string
  metadata: {
    title: string
    category: string
    tags: string[]
    priority: string
  }
  languages: {
    english?: {
      platforms: PlatformContent[]
    }
    japanese?: {
      platforms: PlatformContent[]
    }
  }
}

export interface PlatformContent {
  platform: string
  content: string
  metadata: {
    tokens: number
    cost: number
    model: string
    originalLength: number
    finalLength: number
  }
}

export interface PostSchedule {
  id: string
  session_id: string
  content_id?: string
  imported_content: QuitePostContent
  selected_language: 'english' | 'japanese'
  selected_platforms: string[]
  scheduled_time: string
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled'
  calendar_event_id?: string
  access_token: string
  copy_status: Record<string, string>
  notifications_sent: string[]
  created_at: string
  updated_at: string
}

export interface AppSettings {
  session_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification_settings: Record<string, any>
  calendar_integration: boolean
  language_preference: 'auto' | 'en' | 'ja'
  timezone: string
  created_at: string
  updated_at: string
}

// UI関連の型
export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
}

export interface CopyStatus {
  platform: string
  status: 'pending' | 'copied' | 'failed'
  copied_at?: string
}

// API関連の型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Google認証関連の型定義
export interface UserTokenData {
  access_token: string
  expires_in?: number
  token_type?: string
  scope?: string
}

export interface UserInfo {
  tokenData: UserTokenData
}

export interface GoogleAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  googleAccessToken: string | null
  userInfo: UserInfo | null
}

export interface ImportRequest {
  json_content: string
  filename?: string
}

export interface ScheduleRequest {
  content_id: string
  selected_language: 'english' | 'japanese'
  selected_platforms: string[]
  scheduled_time: string
}

// 国際化関連の型
export type Locale = 'en' | 'ja'

export interface Messages {
  [key: string]: string | Messages
}