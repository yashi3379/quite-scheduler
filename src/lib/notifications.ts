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
    // セッションベースなので、固定トークンかセッションIDを返す
    // 実際のプロジェクトではSupabaseのauth.getSession()を使用
    return 'session-token'
  }
}

export const notificationService = new NotificationService()