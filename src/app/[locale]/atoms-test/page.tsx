'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useSession, useContent, useSchedule, useNotifications, useUI } from '@/hooks/useAtoms'

export default function AtomsTestPage() {
  const { settings, updateSettings } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { history, favorites, stats, addToHistory, toggleFavorite } = useContent()
  const { schedules, stats: scheduleStats, addSchedule } = useSchedule()
  const { notifications, addNotification } = useNotifications()
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUI()

  const [testContent, setTestContent] = useState('')

  const handleAddTestContent = () => {
    if (!testContent.trim()) return

    const newContent = {
      id: crypto.randomUUID(),
      session_id: 'test-session',
      content_id: `test-${Date.now()}`,
      content: {
        version: '1.0',
        created_at: new Date().toISOString(),
        content_id: `test-${Date.now()}`,
        metadata: {
          title: testContent,
          category: 'test',
          tags: ['test'],
          priority: 'medium'
        },
        languages: {
          english: {
            platforms: [{
              platform: 'twitter',
              content: testContent,
              metadata: {
                tokens: 100,
                cost: 0.001,
                model: 'gpt-4o-mini',
                originalLength: testContent.length,
                finalLength: testContent.length
              }
            }]
          }
        }
      },
      title: testContent,
      tags: ['test'],
      is_favorite: false,
      created_at: new Date().toISOString()
    }

    addToHistory(newContent)
    setTestContent('')
  }

  const handleAddTestSchedule = () => {
    const newSchedule = {
      id: crypto.randomUUID(),
      session_id: 'test-session',
      content_id: history[0]?.id,
      imported_content: history[0]?.content || {},
      selected_language: 'english' as const,
      selected_platforms: ['twitter'],
      scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled' as const,
      access_token: crypto.randomUUID(),
      copy_status: {},
      notifications_sent: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    addSchedule(newSchedule)
  }

  const handleAddTestNotification = () => {
    addNotification({
      type: 'success',
      title: 'Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleTimeString()}`
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Atoms State Management Test</h1>
        
        {/* Session Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select 
                  value={settings.language} 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => (updateSettings as any)({ language: e.target.value as 'en' | 'ja' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select 
                  value={theme} 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={toggleSidebar}>
                  Sidebar: {sidebarOpen ? 'Open' : 'Closed'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter test content"
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddTestContent}>Add Content</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.favorites}</div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.recent}</div>
                  <div className="text-sm text-gray-600">Recent</div>
                </div>
              </div>

              {history.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Content History:</h3>
                  {history.slice(0, 5).map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <span className="truncate">{content.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={content.is_favorite ? 'success' : 'default'}>
                          {content.is_favorite ? 'Favorite' : 'Normal'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => toggleFavorite(content.id)}
                        >
                          ⭐
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Schedule Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleAddTestSchedule} disabled={history.length === 0}>
                Add Test Schedule
              </Button>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{scheduleStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{scheduleStats.scheduled}</div>
                  <div className="text-sm text-gray-600">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{scheduleStats.posted}</div>
                  <div className="text-sm text-gray-600">Posted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{scheduleStats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>

              {schedules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Schedules:</h3>
                  {schedules.slice(0, 3).map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <span className="truncate">
                        {new Date(schedule.scheduled_time).toLocaleString()}
                      </span>
                      <Badge variant={
                        schedule.status === 'scheduled' ? 'default' :
                        schedule.status === 'posted' ? 'success' :
                        schedule.status === 'failed' ? 'danger' : 'warning'
                      }>
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleAddTestNotification}>
                Add Test Notification
              </Button>
              
              {notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div>
                        <div className="font-semibold">{notification.title}</div>
                        <div className="text-sm text-gray-600">{notification.message}</div>
                      </div>
                      <Badge variant={
                        notification.type === 'success' ? 'success' :
                        notification.type === 'error' ? 'danger' :
                        notification.type === 'warning' ? 'warning' : 'default'
                      }>
                        {notification.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}