'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { userSettingsAtom } from '@/atoms/userAtoms'
import { useGoogleAuth } from '@/components/auth/GoogleAuthProvider'

interface CalendarNotificationSetting {
  id: string
  method: 'email' | 'popup'
  minutes: number
  enabled: boolean
}

export default function GoogleCalendarNotificationSettings() {
  const t = useTranslations('notifications')
  const [, setUserSettings] = useAtom(userSettingsAtom)
  const { isAuthenticated, isLoading, signInWithGoogle, signOut, googleAccessToken, userInfo } = useGoogleAuth()
  const [notificationSettings, setNotificationSettings] = useState<CalendarNotificationSetting[]>([
    { id: '30min', method: 'popup', minutes: 30, enabled: true },
    { id: '10min', method: 'popup', minutes: 10, enabled: true },
    { id: '0min', method: 'popup', minutes: 0, enabled: true }
  ])
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    // Load saved settings from localStorage or user preferences
    const saved = localStorage.getItem('calendarNotificationSettings')
    if (saved) {
      try {
        setNotificationSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse saved notification settings:', error)
      }
    }
  }, [])

  const saveSettings = (newSettings: CalendarNotificationSetting[]) => {
    setNotificationSettings(newSettings)
    localStorage.setItem('calendarNotificationSettings', JSON.stringify(newSettings))
    
    // Update user settings atom
    setUserSettings(prev => ({
      ...prev,
      calendarNotifications: {
        enabled: newSettings.some(s => s.enabled),
        settings: newSettings
      }
    }))
  }

  const toggleNotification = (id: string) => {
    const newSettings = notificationSettings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    )
    saveSettings(newSettings)
  }

  const updateNotificationMethod = (id: string, method: 'email' | 'popup') => {
    const newSettings = notificationSettings.map(setting =>
      setting.id === id ? { ...setting, method } : setting
    )
    saveSettings(newSettings)
  }

  const updateNotificationMinutes = (id: string, minutes: number) => {
    const newSettings = notificationSettings.map(setting =>
      setting.id === id ? { ...setting, minutes } : setting
    )
    saveSettings(newSettings)
  }

  const addCustomNotification = () => {
    const customId = `custom_${Date.now()}`
    const newSettings = [...notificationSettings, {
      id: customId,
      method: 'popup' as const,
      minutes: 60,
      enabled: true
    }]
    saveSettings(newSettings)
  }

  const removeNotification = (id: string) => {
    if (id.startsWith('custom_')) {
      const newSettings = notificationSettings.filter(setting => setting.id !== id)
      saveSettings(newSettings)
    }
  }

  const authenticateGoogle = async () => {
    try {
      console.log('Starting Google authentication with Supabase...')
      
      const success = await signInWithGoogle()
      console.log('Authentication result:', success)
      
      if (success) {
        console.log('Google認証が成功しました')
        // 成功時はアラートを表示せず、UIの状態変化で通知
      } else {
        console.error('Google認証に失敗しました')
        // 失敗時のみエラーメッセージを表示する必要がある場合はUIで表示
      }
    } catch (error) {
      console.error('Google authentication failed:', error)
      // エラーはGoogleAuthProviderで適切にハンドリングされるので、ここではアラートを表示しない
    }
  }

  const updateGoogleCalendarSettings = async () => {
    if (!isAuthenticated || !googleAccessToken) {
      console.warn('認証が必要です')
      // UIに認証ボタンが表示されているので、アラートは不要
      return
    }

    setUpdateLoading(true)
    try {
      // Convert settings to Google Calendar format
      const reminders = notificationSettings
        .filter(s => s.enabled)
        .map(s => ({
          method: s.method,
          minutes: s.minutes
        }))

      // Use the updated Google Calendar service
      const { googleCalendarService } = await import('@/lib/googleCalendar')
      
      const success = await googleCalendarService.updateDefaultReminders(reminders, googleAccessToken)
      
      if (success) {
        console.log('Googleカレンダーの通知設定を更新しました')
        // TODO: 成功通知をUIで表示（トースト通知など）
      } else {
        console.error('カレンダー設定の更新に失敗しました')
        // TODO: エラー通知をUIで表示
      }
    } catch (error) {
      console.error('Failed to update calendar settings:', error)
      // TODO: エラー通知をUIで表示
    } finally {
      setUpdateLoading(false)
    }
  }

  const getMethodIcon = (method: 'email' | 'popup') => {
    return method === 'email' ? '📧' : '🔔'
  }

  const getTimeText = (minutes: number) => {
    if (minutes === 0) return t('atTime')
    if (minutes < 60) return t('minutesBefore', { minutes })
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return t('hoursBefore', { hours })
    }
    return t('hoursMinutesBefore', { 
      hours, minutes: remainingMinutes
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 {t('calendarNotifications')}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {t('calendarNotificationsDesc')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            ⚙️ {t('notificationSettings')}
          </h3>
          
          <div className="space-y-3">
            {notificationSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={setting.enabled}
                    onChange={() => toggleNotification(setting.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-lg">
                    {getMethodIcon(setting.method)}
                  </span>
                  <div>
                    <p className="font-medium">
                      {getTimeText(setting.minutes)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {setting.method === 'email' ? 
                        t('emailNotification') : 
                        t('popupNotification')
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={setting.method}
                    onChange={(e) => updateNotificationMethod(setting.id, e.target.value as 'email' | 'popup')}
                    className="text-xs px-2 py-1 border rounded"
                    disabled={!setting.enabled}
                  >
                    <option value="popup">{t('popup')}</option>
                    <option value="email">{t('email')}</option>
                  </select>
                  
                  <select
                    value={setting.minutes}
                    onChange={(e) => updateNotificationMinutes(setting.id, parseInt(e.target.value))}
                    className="text-xs px-2 py-1 border rounded"
                    disabled={!setting.enabled}
                  >
                    <option value={0}>{t('atTime')}</option>
                    <option value={5}>5{t('minutesShort')}</option>
                    <option value={10}>10{t('minutesShort')}</option>
                    <option value={15}>15{t('minutesShort')}</option>
                    <option value={30}>30{t('minutesShort')}</option>
                    <option value={60}>1{t('hourShort')}</option>
                    <option value={120}>2{t('hoursShort')}</option>
                    <option value={1440}>1{t('dayShort')}</option>
                  </select>
                  
                  {setting.id.startsWith('custom_') && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeNotification(setting.id)}
                      className="text-xs px-2 py-1"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!isAuthenticated && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                {t('authenticationRequired') || 'Googleカレンダーの通知設定を変更するには認証が必要です。'}
              </p>
              <p className="text-xs text-yellow-600 mb-3">
                ℹ️ OAuth 2.0でGoogle認証を行います。Google Calendarのフルアクセス権限が必要です。
              </p>
              <Button
                onClick={authenticateGoogle}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>認証ページに移動中...</span>
                  </div>
                ) : (
                  '🔐 Google認証'
                )}
              </Button>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-green-800">
                  ✅ Google認証が完了しました
                </p>
                <Button
                  onClick={async () => {
                    try {
                      console.log('Sign out button clicked')
                      await signOut()
                      console.log('Sign out completed from UI')
                    } catch (error) {
                      console.error('Sign out failed from UI:', error)
                    }
                  }}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  {isLoading ? 'サインアウト中...' : '🚪 サインアウト'}
                </Button>
              </div>
              {userInfo?.tokenData && (
                <div className="text-xs text-green-600 mb-2">
                  🔑 アクセストークン取得済み • スコープ: Google Calendar
                  <br />
                  📋 有効期限: {userInfo.tokenData.expires_in ? `${Math.floor(userInfo.tokenData.expires_in / 3600)}時間` : '不明'}
                </div>
              )}
              <div className="text-xs text-green-600">
                🔒 OAuth 2.0で安全に認証済み • 📅 Google Calendar APIアクセス権限付与
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={addCustomNotification}
                  variant="secondary"
                  className="flex-1"
                >
                  ➕ {t('addCustomNotification')}
                </Button>
                
                <Button
                  onClick={updateGoogleCalendarSettings}
                  disabled={updateLoading}
                  className="flex-1"
                >
                  {updateLoading ? 
                    t('updating') || '更新中...' : 
                    `📅 ${t('updateCalendarSettings') || 'カレンダー設定を更新'}`
                  }
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            ℹ️ {t('howItWorks')}
          </h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• {t('directCalendarControl') || 'この設定はGoogleカレンダーの通知設定を直接制御します'}</p>
            <p>• {t('howItWorks1')}</p>
            <p>• {t('automaticSync') || '設定変更は即座にGoogleカレンダーに同期されます'}</p>
            <p>• {t('howItWorks4')}</p>
            <p>• {t('noAppNotifications') || 'アプリ独自の通知機能は使用せず、Googleの通知のみを利用します'}</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          {t('privacyNote')}
        </div>
      </CardContent>
    </Card>
  )
}