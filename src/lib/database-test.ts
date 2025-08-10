// データベース接続テスト用ファイル
import { supabase } from './supabase'

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...')
    
    // 1. 接続テスト
    const { data, error } = await supabase
      .from('session_data')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Database connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    console.log(`Current session count: ${data?.length || 0}`)
    
    // 2. セッション作成テスト
    const testSessionId = `test-${Date.now()}`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: insertData, error: insertError } = await supabase
      .from('session_data')
      .insert({
        session_id: testSessionId,
        timezone: 'Asia/Tokyo',
        language: 'ja'
      })
      .select()
    
    if (insertError) {
      console.error('Session creation test failed:', insertError)
      return false
    }
    
    console.log('✅ Session creation test successful')
    
    // 3. セッション削除テスト（テストデータ削除）
    const { error: deleteError } = await supabase
      .from('session_data')
      .delete()
      .eq('session_id', testSessionId)
    
    if (deleteError) {
      console.error('Session deletion test failed:', deleteError)
      return false
    }
    
    console.log('✅ Session deletion test successful')
    console.log('✅ All database tests passed')
    
    return true
  } catch (error) {
    console.error('Database test error:', error)
    return false
  }
}

export async function testSupabaseEnvironment(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    return false
  }
  
  if (!key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    return false
  }
  
  console.log('✅ Supabase environment variables are set')
  console.log(`URL: ${url.substring(0, 30)}...`)
  console.log(`Key: ${key.substring(0, 20)}...`)
  
  return true
}