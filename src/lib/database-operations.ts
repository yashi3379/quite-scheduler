// データベース操作関数
import { supabase } from './supabase'
import { ImportedContent, PostSchedule, AppSettings } from '@/types'
import type { Database } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Tables = Database['public']['Tables']

// セッションデータ操作
export async function createSession(sessionId: string, timezone?: string, language?: string) {
  const { data, error } = await supabase
    .from('session_data')
    .insert({
      session_id: sessionId,
      timezone: timezone || 'UTC',
      language: language || 'en'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('session_data')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function updateSessionActivity(sessionId: string) {
  const { error } = await supabase
    .from('session_data')
    .update({
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30日延長
    })
    .eq('session_id', sessionId)

  if (error) throw error
}

// インポートコンテンツ操作
export async function saveImportedContent(content: Omit<ImportedContent, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('imported_content')
    .insert({
      session_id: content.session_id,
      original_filename: content.original_filename,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: content.content as any,
      content_id: content.content_id,
      title: content.title,
      tags: content.tags,
      is_favorite: content.is_favorite
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getImportedContent(sessionId: string, limit = 50) {
  const { data, error } = await supabase
    .from('imported_content')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getImportedContentById(id: string) {
  const { data, error } = await supabase
    .from('imported_content')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateImportedContent(id: string, updates: Partial<ImportedContent>) {
  const { data, error } = await supabase
    .from('imported_content')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteImportedContent(id: string) {
  const { error } = await supabase
    .from('imported_content')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// スケジュール投稿操作
export async function createScheduledPost(schedule: Omit<PostSchedule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      session_id: schedule.session_id,
      content_id: schedule.content_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imported_content: schedule.imported_content as any,
      selected_language: schedule.selected_language,
      selected_platforms: schedule.selected_platforms,
      scheduled_time: schedule.scheduled_time,
      status: schedule.status,
      calendar_event_id: schedule.calendar_event_id,
      access_token: schedule.access_token,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      copy_status: schedule.copy_status as any,
      notifications_sent: schedule.notifications_sent
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getScheduledPosts(sessionId: string, limit = 50) {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('session_id', sessionId)
    .order('scheduled_time', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getScheduledPostByAccessToken(accessToken: string) {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('access_token', accessToken)
    .single()

  if (error) throw error
  return data
}

export async function updateScheduledPost(id: string, updates: Partial<PostSchedule>) {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(updates as any),
      updated_at: new Date().toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteScheduledPost(id: string) {
  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// アプリ設定操作
export async function getAppSettings(sessionId: string) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) {
    // 設定が存在しない場合はデフォルト値を返す
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }
  return data
}

export async function upsertAppSettings(settings: Omit<AppSettings, 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({
      session_id: settings.session_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notification_settings: settings.notification_settings as any,
      calendar_integration: settings.calendar_integration,
      language_preference: settings.language_preference,
      timezone: settings.timezone,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ユーティリティ関数
export async function cleanupExpiredSessions() {
  const { error } = await supabase.rpc('cleanup_expired_sessions')
  if (error) throw error
}

export async function getSessionStats(sessionId: string) {
  const [contentCount, scheduledCount] = await Promise.all([
    supabase
      .from('imported_content')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId),
    supabase
      .from('scheduled_posts')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
  ])

  return {
    importedContentCount: contentCount.count || 0,
    scheduledPostsCount: scheduledCount.count || 0
  }
}