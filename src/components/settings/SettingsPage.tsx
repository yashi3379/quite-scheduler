'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { userSettingsWithPersistenceAtom } from '@/atoms/userAtoms'
import NotificationSettings from '@/components/notifications/NotificationSettings'

// getAccessToken function is defined at the bottom of the file

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useAtom(userSettingsWithPersistenceAtom)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSaveSettings = async () => {
    setIsSaving(true)
    
    try {
      // サーバーに設定を保存
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify(userSettings)
      })
      
      if (response.ok) {
        setSaveMessage('Settings saved successfully!')
      } else {
        setSaveMessage('Failed to save settings. Please try again.')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(userSettings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `quite-scheduler-settings-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setUserSettings({
        language: 'en',
        timezone: 'UTC',
        theme: 'system',
        notifications: true,
        // calendar_integration: false // Not part of UserSettings interface
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 基本設定 */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={userSettings.language}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => (setUserSettings as any)((prev: any) => ({ ...prev, language: e.target.value as 'en' | 'ja' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={userSettings.timezone}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => (setUserSettings as any)((prev: any) => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex gap-2">
              {['system', 'light', 'dark'].map(theme => (
                <button
                  key={theme}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => (setUserSettings as any)((prev: any) => ({ ...prev, theme: theme as any }))}
                  className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                    userSettings.theme === theme
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 通知設定 */}
      <NotificationSettings />

      {/* 統合設定 */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Google Calendar</h3>
              <p className="text-sm text-gray-600">
                Add scheduled posts to your calendar
              </p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                checked={(userSettings as any).calendar_integration || false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => (setUserSettings as any)((prev: any) => ({ 
                  ...prev, 
                  calendar_integration: e.target.checked 
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 設定管理 */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Settings Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : '💾 Save Settings'}
            </Button>
            <Button 
              onClick={exportSettings}
              variant="secondary"
              className="flex-1"
            >
              📥 Export Settings
            </Button>
            <Button 
              onClick={resetSettings}
              variant="danger"
              className="flex-1"
            >
              🔄 Reset to Default
            </Button>
          </div>
          
          {saveMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              saveMessage.includes('success') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function getAccessToken(): Promise<string> {
  // For now, return empty string as we don't have Supabase setup in context
  return ''
}