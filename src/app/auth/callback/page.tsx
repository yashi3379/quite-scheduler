'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  
  useEffect(() => {
    // 直接リダイレクト方式では、このページは基本的に経由されない
    // URLパラメータが残っている場合はホームページにリダイレクト
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (code || error) {
      console.log('Redirecting from callback page to home with params')
      // パラメータ付きでホームページにリダイレクト
      router.push(`/?${urlParams.toString()}`)
    } else {
      // パラメータなしの場合は単純にホームページへ
      router.push('/')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">リダイレクト中...</p>
        <p className="text-sm text-gray-500 mt-2">ホームページに移動しています</p>
      </div>
    </div>
  )
}