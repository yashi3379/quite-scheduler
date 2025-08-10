import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { generateId } from './utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// MVP版: セッションID管理（ローカルストレージベース）
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem('quite_scheduler_session')
  if (!sessionId) {
    sessionId = generateId()
    localStorage.setItem('quite_scheduler_session', sessionId)
  }
  return sessionId
}

// セッション初期化（MVP版）
export const initializeSession = async (): Promise<string> => {
  const sessionId = getOrCreateSessionId()
  
  if (!sessionId) return ''
  
  // 既存セッションチェック
  const { data: existingSession } = await supabase
    .from('session_data')
    .select('id')
    .eq('session_id', sessionId)
    .single()
  
  if (!existingSession) {
    // 新規セッション作成
    const { error } = await supabase
      .from('session_data')
      .insert({
        session_id: sessionId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language.startsWith('ja') ? 'ja' : 'en'
      })
    
    if (error) {
      console.error('Failed to initialize session:', error)
    }
  }
  
  return sessionId
}

// セッション有効性チェック
export const validateSession = async (sessionId: string): Promise<boolean> => {
  if (!sessionId) return false
  
  const { data, error } = await supabase
    .from('session_data')
    .select('expires_at')
    .eq('session_id', sessionId)
    .single()
  
  if (error || !data) return false
  
  return new Date(data.expires_at) > new Date()
}

// セッション更新（アクティビティ検出時）
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('session_data')
    .update({
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30日延長
    })
    .eq('session_id', sessionId)
  
  if (error) {
    console.error('Failed to update session activity:', error)
  }
}