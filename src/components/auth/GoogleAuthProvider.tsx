'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { GoogleAuthContextType, UserInfo } from '@/types'

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null)

interface GoogleAuthProviderProps {
  children: ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const isAuthenticated = Boolean(googleAccessToken)

  useEffect(() => {
    // セッション復元を試行
    const restoreSession = () => {
      try {
        const savedToken = localStorage.getItem('google_access_token')
        const savedUserInfo = localStorage.getItem('google_user_info')
        const tokenExpiry = localStorage.getItem('google_token_expiry')
        
        if (savedToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry)
          if (Date.now() < expiryTime) {
            setGoogleAccessToken(savedToken)
            if (savedUserInfo) {
              const parsedUserInfo = JSON.parse(savedUserInfo)
              setUserInfo(parsedUserInfo)
            }
          } else {
            clearSession()
          }
        } else {
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        clearSession()
      }
    }
    
    // OAuth コールバックからの復帰をチェック
    const checkOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      const oauthInProgress = sessionStorage.getItem('oauth_in_progress')
      
      if (oauthInProgress && (code || error)) {
        
        // 認証処理中状態を設定してUIを安定させる
        setIsProcessingAuth(true)
        setAuthError(null)
        
        // 認証進行中フラグをクリア
        sessionStorage.removeItem('oauth_in_progress')
        sessionStorage.removeItem('oauth_start_time')
        
        // URLからパラメータをクリア
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
        
        if (error) {
          console.error('OAuth authentication error:', error)
          setAuthError(`認証エラー: ${error}`)
          setIsProcessingAuth(false)
          return
        }
        
        if (code) {
          setIsLoading(true)
          
          // UIのチラつきを防ぐため、少し待ってから処理
          await new Promise(resolve => setTimeout(resolve, 300))
          
          try {
            const success = await exchangeCodeForToken(code)
            if (success) {
              setAuthError(null)
              // UIを安定させるための遅延
              await new Promise(resolve => setTimeout(resolve, 500))
            } else {
              setAuthError('認証に失敗しました。もう一度お試しください。')
            }
          } catch (error) {
            console.error('Token exchange error:', error)
            setAuthError('認証処理中にエラーが発生しました。')
          } finally {
            setIsLoading(false)
            setIsProcessingAuth(false)
          }
        }
      }
    }

    // 初期化処理
    const initialize = async () => {
      setIsInitializing(true)
      
      try {
        await restoreSession()
        await checkOAuthCallback()
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        // 初期化完了を少し遅らせて、UIのちらつきを防ぐ
        setTimeout(() => {
          setIsInitializing(false)
        }, 500)
      }
    }
    
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // exchangeCodeForTokenは初期化後に定義されるため依存配列に含める必要なし

  // セッションクリア関数
  const clearSession = () => {
    console.log('Clearing all authentication sessions...')
    
    try {
      localStorage.removeItem('google_access_token')
      localStorage.removeItem('google_user_info')
      localStorage.removeItem('google_token_expiry')
    } catch (error) {
    }
    
    setGoogleAccessToken(null)
    setUserInfo(null)
    
  }

  // セッション保存関数
  const saveSession = (token: string, userInfo?: UserInfo) => {
    try {
      const expiryTime = Date.now() + (3600 * 1000) // 1時間後
      localStorage.setItem('google_access_token', token)
      localStorage.setItem('google_token_expiry', expiryTime.toString())
      if (userInfo) {
        localStorage.setItem('google_user_info', JSON.stringify(userInfo))
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
    }
  }

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      
      if (typeof window === 'undefined') {
        throw new Error('Window not available')
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1013640075029-u1lt7k9mmv7in4p476efeksmcmvi197i.apps.googleusercontent.com'
      const redirectUri = `${window.location.origin}/auth/callback`
      const scope = 'https://www.googleapis.com/auth/calendar' // Full calendar access for settings and events
      
      
      // OAuth 2.0 authorization URL を構築
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      
      
      
      // 認証進行中のマーカーを保存
      sessionStorage.setItem('oauth_in_progress', 'true')
      sessionStorage.setItem('oauth_start_time', Date.now().toString())
      
      // 認証ページへのリダイレクトを少し遅らせてUIを安定させる
      setTimeout(() => {
        window.location.href = authUrl.toString()
      }, 1000)
      
      // この関数は実際にはリダイレクト後に戻ってこないが、TypeScriptのために戻り値を返す
      return Promise.resolve(true)
    } catch (error) {
      console.error('OAuth authentication failed:', error)
      // 認証エラーはUIで適切に表示されるので、alertは使用しない
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Authorization code をアクセストークンに交換
  const exchangeCodeForToken = async (code: string): Promise<boolean> => {
    try {
      
      // サーバーサイドAPIでトークン交換
      const response = await fetch('/api/google-calendar/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Token exchange API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(`Token exchange failed: ${response.status} - ${JSON.stringify(errorData)}`)
      }
      
      const data = await response.json()
      console.log('Access token received successfully')
      
      // アクセストークンを受信したらセッション保存と状態更新
      if (data.access_token) {
        console.log('Saving authentication session and updating UI state...')
        saveSession(data.access_token, { tokenData: data })
        
        // UI状態を即座に更新
        setUserInfo({ tokenData: data })
        setGoogleAccessToken(data.access_token)
        
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to exchange code for token:', error)
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      // まずローカル状態をクリア（最優先）
      clearSession()
      
      // 従来のGoogle APIサインアウト（利用可能な場合）
      if (window.gapi?.auth2) {
        try {
          const authInstance = window.gapi.auth2.getAuthInstance()
          if (authInstance && authInstance.isSignedIn.get()) {
            await authInstance.signOut()
          }
        } catch (gapiError) {
        }
      }
      
      
    } catch (error) {
      console.error('Sign out process encountered error:', error)
      // エラーがあってもローカルセッションは確実にクリア
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  // 初期化中または認証処理中のローディング画面
  if (isInitializing || isProcessingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isProcessingAuth ? '認証完了中...' : 'アプリを初期化中...'}
          </h2>
          <p className="text-gray-600">
            {isProcessingAuth ? 'ログイン情報を設定しています' : '認証状態を確認しています'}
          </p>
          <div className="mt-4">
            <div className="inline-flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <GoogleAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signInWithGoogle,
        signOut,
        googleAccessToken,
        userInfo
      }}
    >
      {children}
      
      {/* 認証処理中のオーバーレイローディング */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">認証処理中</h3>
            <p className="text-gray-600 text-sm">しばらくお待ちください...</p>
          </div>
        </div>
      )}
      
      {/* エラー表示 */}
      {authError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm">{authError}</p>
              <button 
                onClick={() => setAuthError(null)}
                className="mt-2 text-xs underline hover:no-underline"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </GoogleAuthContext.Provider>
  )
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext)
  if (!context) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider')
  }
  return context
}

// Window オブジェクトに Google APIs の型定義を追加
declare global {
  interface Window {
    gapi: {
      auth2: {
        getAuthInstance(): {
          isSignedIn: { get(): boolean }
          signOut(): Promise<void>
        }
      }
    }
    google: unknown
  }
}