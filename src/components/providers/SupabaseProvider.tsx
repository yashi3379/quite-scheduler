'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { Database } from '@/types/database'

interface SupabaseProviderProps {
  children: ReactNode
}

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabaseClient] = useState(() => {
    try {
      // cross-site問題を解決するための設定
      return createPagesBrowserClient<Database>({
        cookieOptions: {
          name: 'supabase-auth-token',
          path: '/',
          domain: undefined, // localhostではcross-site問題を避ける
          sameSite: 'lax', // Laxでcross-siteナビゲーションを許可
          secure: false // localhostではfalse
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      })
    } catch (error) {
      console.warn('Failed to create Supabase client:', error)
      // フォールバッククライアントを作成
      return null
    }
  })
  const [connectionError, setConnectionError] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (!supabaseClient) {
      setConnectionError(true)
      return
    }

    // Supabase接続テスト
    const testConnection = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.warn('Supabase connection issue:', error)
          
          // OAuth設定エラーかチェック
          if (error.message?.includes('validation_failed') || 
              error.message?.includes('missing OAuth secret')) {
            console.warn('Supabase OAuth not configured properly')
          }
          
          setConnectionError(true)
          setIsOnline(false)
        } else {
          setIsOnline(true)
          setConnectionError(false)
        }
      } catch (error) {
        console.warn('Supabase unavailable:', error)
        setConnectionError(true)
        setIsOnline(false)
      }
    }
    
    testConnection()
    
    // 定期的に接続をテスト
    const interval = setInterval(testConnection, 30000) // 30秒毎
    return () => clearInterval(interval)
  }, [supabaseClient])

  // 接続エラーの場合でもアプリを動作させる
  if (connectionError || !supabaseClient) {
    console.warn('Running in offline mode - Supabase features disabled')
    
    // モックプロバイダーでアプリを継続動作
    return (
      <div data-supabase-offline="true">
        {children}
      </div>
    )
  }

  return (
    <SessionContextProvider 
      supabaseClient={supabaseClient}
      initialSession={null}
    >
      <div data-supabase-online={isOnline}>
        {children}
      </div>
    </SessionContextProvider>
  )
}