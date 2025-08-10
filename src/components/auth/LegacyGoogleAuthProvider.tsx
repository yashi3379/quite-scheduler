'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface LegacyGoogleAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  googleAccessToken: string | null
}

const LegacyGoogleAuthContext = createContext<LegacyGoogleAuthContextType | null>(null)

interface LegacyGoogleAuthProviderProps {
  children: ReactNode
}

export function LegacyGoogleAuthProvider({ children }: LegacyGoogleAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const isAuthenticated = Boolean(googleAccessToken)

  useEffect(() => {
    // Google API Script の動的読み込み
    const loadGoogleAPI = async () => {
      if (typeof window === 'undefined') return
      
      // 既に読み込まれている場合
      if (window.gapi) {
        await initializeGoogleAPI()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = async () => {
        await initializeGoogleAPI()
      }
      document.head.appendChild(script)
    }

    const initializeGoogleAPI = async () => {
      if (!window.gapi) return

      try {
        // サーバーから設定を取得
        const response = await fetch('/api/google-calendar/auth', {
          method: 'POST'
        })
        
        if (!response.ok) {
          console.warn('Cannot get Google auth config - using fallback')
          return
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authConfig = await (response.json as any)()
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.gapi as any).load('client:auth2', async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (window.gapi as any).client.init({
              clientId: authConfig.clientId,
              scope: 'https://www.googleapis.com/auth/calendar.events'
            })
            
            setIsInitialized(true)
            
            // 既存の認証状態をチェック
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const authInstance = (window.gapi as any).auth2.getAuthInstance()
            if (authInstance?.isSignedIn.get()) {
              const token = authInstance.currentUser.get().getAuthResponse().access_token
              setGoogleAccessToken(token)
            }
          } catch (error) {
            console.error('Failed to initialize Google API:', error)
          }
        })
      } catch (error) {
        console.error('Failed to load Google auth config:', error)
      }
    }

    loadGoogleAPI()
  }, [])

  const signInWithGoogle = async (): Promise<boolean> => {
    if (!isInitialized) {
      alert('Google APIの初期化中です。しばらく待ってから再試行してください。')
      return false
    }

    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authInstance = (window.gapi as any).auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error('Auth instance not available')
      }
      
      const result = await authInstance.signIn()
      const token = result.getAuthResponse().access_token
      setGoogleAccessToken(token)
      
      return true
    } catch (error) {
      console.error('Google authentication failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window.gapi as any)?.auth2) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authInstance = (window.gapi as any).auth2.getAuthInstance()
        await authInstance?.signOut()
      }
      setGoogleAccessToken(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LegacyGoogleAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signInWithGoogle,
        signOut,
        googleAccessToken
      }}
    >
      {children}
    </LegacyGoogleAuthContext.Provider>
  )
}

export function useLegacyGoogleAuth() {
  const context = useContext(LegacyGoogleAuthContext)
  if (!context) {
    throw new Error('useLegacyGoogleAuth must be used within LegacyGoogleAuthProvider')
  }
  return context
}

// Note: Using type casting for gapi to avoid interface conflicts with GoogleAuthProvider.tsx