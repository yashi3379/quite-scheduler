'use client'

import { useEffect } from 'react'

export default function SupabaseAuthCallback() {
  useEffect(() => {
    // 最小限の処理でクラッシュ原因を特定
    const handleCallback = () => {
      try {
        console.log('CALLBACK: Starting minimal processing')
        
        // まずはSupabase処理をスキップして、単純にリダイレクト
        console.log('CALLBACK: Setting auth success flag')
        
        // localStorage操作を避けて、sessionStorageを使用
        try {
          sessionStorage.setItem('auth_callback_success', 'true')
        } catch (storageError) {
          console.warn('Storage error (ignoring):', storageError)
        }
        
        console.log('CALLBACK: Redirecting to home')
        
        // cross-site問題を避けるため、親ウィンドウが存在するかチェック
        if (window.opener) {
          console.log('CALLBACK: Found parent window, sending success message')
          // 親ウィンドウに成功を通知
          window.opener.postMessage({
            type: 'AUTH_CALLBACK_SUCCESS',
            timestamp: Date.now()
          }, window.location.origin)
          
          // ポップアップを閉じる
          window.close()
        } else {
          console.log('CALLBACK: No parent window, direct redirect')
          // 直接リダイレクト
          window.location.href = '/'
        }
        
      } catch (error) {
        console.error('CALLBACK: Error in minimal processing:', error)
        // エラー時もリダイレクト
        window.location.href = '/'
      }
    }
    
    console.log('CALLBACK: Component mounted')
    
    // 少し待ってから処理開始
    const timer = setTimeout(handleCallback, 500)
    
    return () => {
      console.log('CALLBACK: Component cleanup')
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証コールバック処理中...</p>
        <p className="text-sm text-gray-500 mt-2">最小限の処理でリダイレクトします</p>
        <p className="text-xs text-gray-400 mt-1">クラッシュデバッグモード</p>
      </div>
    </div>
  )
}