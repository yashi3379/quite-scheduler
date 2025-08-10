// 認証設定の管理
export function isSupabaseAvailable(): boolean {
  if (typeof window === 'undefined') return true // SSRでは判定しない
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // 環境変数が設定されているかチェック
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured')
    return false
  }
  
  // URLが正しい形式かチェック
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('Invalid Supabase URL format')
    return false
  }
  
  return true
}

export function shouldUseLegacyAuth(): boolean {
  // Supabaseが利用できない場合は従来の認証方式を使用
  return !isSupabaseAvailable()
}