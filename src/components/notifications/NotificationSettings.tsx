'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { notificationService } from '@/lib/notifications'
import { userSettingsAtom } from '@/atoms/userAtoms'

export default function NotificationSettings() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userSettings, setUserSettings] = useAtom(userSettingsAtom)
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkNotificationSupport()
  }, [])

  const checkNotificationSupport = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setNotificationPermission(Notification.permission)
      
      // Service Worker初期化
      const initialized = await notificationService.initialize()
      if (initialized) {
        // 既存のサブスクリプション確認
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        }
      }
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    
    try {
      const permission = await notificationService.requestPermission()
      
      if (permission.granted) {
        setNotificationPermission('granted')
        setIsSubscribed(true)
        
        // ユーザー設定を更新
        setUserSettings(prev => ({
          ...prev,
          notifications: true
        }))
        
        alert('通知が有効になりました！')
      } else {
        alert('通知の許可が必要です。ブラウザの設定を確認してください。')
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      alert('通知の有効化に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          setIsSubscribed(false)
          
          // サーバーに無効化を通知
          await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer session-token`
            }
          })
        }
      }
      
      // ユーザー設定を更新
      setUserSettings(prev => ({
        ...prev,
        notifications: false
      }))
      
      alert('通知が無効になりました。')
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      alert('通知の無効化に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = async () => {
    try {
      // まず即座にブラウザ通知を表示
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Quite Scheduler テスト通知', {
          body: 'これはローカルテスト通知です。通知機能が正常に動作しています！',
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg'
        })
      }
      
      // サーバーAPIも呼び出し
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer session-token`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('テスト通知を送信しました！（ブラウザ通知も表示されました）')
      } else {
        alert('テスト通知API呼び出しに失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
      alert('テスト通知の送信に失敗しました。')
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 mb-4">
            ❌ お使いのブラウザは通知機能をサポートしていません
          </p>
          <p className="text-sm text-gray-400">
            Chrome、Firefox、Safari（iOS 16.4+）をご利用ください
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔔 通知設定
        </CardTitle>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            notificationPermission === 'granted' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {notificationPermission === 'granted' ? '✅ 許可済み' : 
             notificationPermission === 'denied' ? '❌ 拒否' : '⏳ 未設定'}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? '📱 購読中' : '📵 未購読'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">通知タイミング</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>🟡</span>
              <span>投稿30分前：準備のお知らせ</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟠</span>
              <span>投稿10分前：最終確認のお知らせ</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>投稿直前：投稿実行のお知らせ</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!isSubscribed ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '設定中...' : '🔔 通知を有効にする'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={sendTestNotification}
                variant="secondary"
                className="w-full"
              >
                📨 テスト通知を送信
              </Button>
              <Button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                variant="danger"
                className="w-full"
              >
                {isLoading ? '無効化中...' : '🔕 通知を無効にする'}
              </Button>
            </div>
          )}
        </div>

        {notificationPermission === 'denied' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ 通知がブロックされています。ブラウザの設定から通知を許可してください。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}