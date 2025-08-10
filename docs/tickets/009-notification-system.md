# チケット #009: 通知システム実装

## 概要
Web Push API、投稿前通知（30分前・10分前・直前）

## 優先度
🟡 中優先度

## 詳細説明
Web Push APIを使用してブラウザ通知システムを実装し、スケジュールされた投稿の30分前、10分前、直前に通知を送信する。

## 実装内容

### 1. Service Worker設定
```typescript
// public/sw.js
const CACHE_NAME = 'quite-scheduler-v1'
const urlsToCache = [
  '/',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
      })
  )
})

// プッシュ通知受信
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a scheduled post coming up!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Post',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/images/xmark.png'
      }
    ]
  }

  let promiseChain = Promise.resolve()
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.icon = data.icon || options.icon
    
    promiseChain = promiseChain.then(() => {
      return self.registration.showNotification(data.title || 'Quite Scheduler', options)
    })
  }

  event.waitUntil(promiseChain)
})

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/schedule')
    )
  } else if (event.action === 'close') {
    // 通知を閉じるだけ
  } else {
    // デフォルトアクション：アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
```

### 2. Web Push通知サービス
```typescript
// lib/notifications.ts
interface NotificationPermission {
  granted: boolean
  subscription: PushSubscription | null
}

interface ScheduledNotification {
  id: string
  scheduleId: string
  type: 'warning_30' | 'warning_10' | 'immediate'
  scheduledTime: string
  sent: boolean
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return false
    }
    
    try {
      // Service Worker登録
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')
      
      // 既存のサブスクリプションを確認
      this.subscription = await this.registration.pushManager.getSubscription()
      
      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }
  
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.registration) {
      throw new Error('Service Worker not registered')
    }
    
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      return { granted: false, subscription: null }
    }
    
    try {
      // VAPID公開鍵（環境変数から取得）
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })
      
      // サーバーにサブスクリプション情報を送信
      await this.sendSubscriptionToServer(this.subscription)
      
      return { granted: true, subscription: this.subscription }
    } catch (error) {
      console.error('Failed to subscribe user:', error)
      return { granted: false, subscription: null }
    }
  }
  
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error)
      throw error
    }
  }
  
  async scheduleNotifications(scheduleId: string, scheduledTime: string): Promise<void> {
    const scheduledDate = new Date(scheduledTime)
    const now = new Date()
    
    const notifications: ScheduledNotification[] = [
      {
        id: `${scheduleId}_30min`,
        scheduleId,
        type: 'warning_30',
        scheduledTime: new Date(scheduledDate.getTime() - 30 * 60 * 1000).toISOString(),
        sent: false
      },
      {
        id: `${scheduleId}_10min`,
        scheduleId,
        type: 'warning_10',
        scheduledTime: new Date(scheduledDate.getTime() - 10 * 60 * 1000).toISOString(),
        sent: false
      },
      {
        id: `${scheduleId}_immediate`,
        scheduleId,
        type: 'immediate',
        scheduledTime: scheduledDate.toISOString(),
        sent: false
      }
    ]
    
    // 過去の時間は除外
    const futureNotifications = notifications.filter(
      notification => new Date(notification.scheduledTime) > now
    )
    
    // サーバーに通知スケジュールを送信
    for (const notification of futureNotifications) {
      await this.scheduleServerNotification(notification)
    }
  }
  
  async scheduleServerNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`
        },
        body: JSON.stringify(notification)
      })
      
      if (!response.ok) {
        throw new Error('Failed to schedule notification')
      }
    } catch (error) {
      console.error('Error scheduling notification:', error)
      throw error
    }
  }
  
  async cancelNotifications(scheduleId: string): Promise<void> {
    try {
      const response = await fetch(`/api/notifications/cancel/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel notifications')
      }
    } catch (error) {
      console.error('Error canceling notifications:', error)
      throw error
    }
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
  
  private async getAccessToken(): Promise<string> {
    // Supabaseからアクセストークンを取得
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }
}

export const notificationService = new NotificationService()
```

### 3. 通知設定コンポーネント
```typescript
// components/notifications/NotificationSettings.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { notificationService } from '@/lib/notifications'
import { userSettingsAtom } from '@/atoms/userAtoms'

export default function NotificationSettings() {
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
              'Authorization': `Bearer ${await getAccessToken()}`
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
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`
        }
      })
      
      alert('テスト通知を送信しました！')
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
          <Badge variant={notificationPermission === 'granted' ? 'success' : 'default'}>
            {notificationPermission === 'granted' ? '✅ 許可済み' : 
             notificationPermission === 'denied' ? '❌ 拒否' : '⏳ 未設定'}
          </Badge>
          <Badge variant={isSubscribed ? 'success' : 'default'}>
            {isSubscribed ? '📱 購読中' : '📵 未購読'}
          </Badge>
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
              loading={isLoading}
              className="w-full"
            >
              🔔 通知を有効にする
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
                loading={isLoading}
                variant="danger"
                className="w-full"
              >
                🔕 通知を無効にする
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

async function getAccessToken(): Promise<string> {
  // Supabaseからアクセストークンを取得
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ''
}
```

### 4. 通知API実装
```typescript
// app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json()
    
    // 認証確認
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // サブスクリプション情報を保存
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription_data: subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'サブスクリプション保存に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション登録に失敗しました' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/notifications/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json()
    
    // 認証確認
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // 通知スケジュールを保存
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: user.id,
        ...notificationData,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '通知スケジュール保存に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Notification schedule error:', error)
    return NextResponse.json(
      { error: '通知スケジュール作成に失敗しました' },
      { status: 500 }
    )
  }
}
```

### 5. マニフェストファイル
```json
// public/manifest.json
{
  "name": "Quite Scheduler",
  "short_name": "QuiteScheduler",
  "description": "AI-powered social media content scheduler",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "gcm_sender_id": "103953800507"
}
```

## 完了条件
- [x] Service Workerが正常に動作
- [x] Web Push通知が送受信可能
- [x] 通知設定コンポーネントが実装済み
- [x] 3段階通知（30分前・10分前・直前）が実装済み
- [x] 通知APIエンドポイントが実装済み
- [x] マニフェストファイルが設定済み
- [x] 通知許可フローが実装済み
- [ ] データベーステーブルが作成済み

## 関連ファイル
- `public/sw.js`
- `public/manifest.json`
- `lib/notifications.ts`
- `components/notifications/NotificationSettings.tsx`
- `app/api/notifications/*/route.ts`

## 見積もり時間
5-6時間

## 注意事項
- ブラウザ互換性を確認
- VAPID鍵の適切な管理
- 通知頻度制限を考慮
- ユーザープライバシーを尊重
- PWA要件を満たす設定