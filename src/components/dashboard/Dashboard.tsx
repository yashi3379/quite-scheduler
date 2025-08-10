'use client'

import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  recentContentAtom, 
  favoriteContentAtom,
  contentStatsAtom
} from '@/atoms/contentAtoms'
import { 
  schedulesAtom,
  upcomingSchedulesAtom, 
  schedulesByStatusAtom,
  scheduleStatsAtom,
  todaySchedulesAtom
} from '@/atoms/scheduleAtoms'

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const [recentContent] = useAtom(recentContentAtom)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [favoriteContent] = useAtom(favoriteContentAtom)
  const [allSchedules] = useAtom(schedulesAtom)
  const [upcomingSchedules] = useAtom(upcomingSchedulesAtom)
  const [schedulesByStatus] = useAtom(schedulesByStatusAtom)
  const [contentStats] = useAtom(contentStatsAtom)
  const [scheduleStats] = useAtom(scheduleStatsAtom)
  const [todaySchedules] = useAtom(todaySchedulesAtom)

  // Debug: スケジュールデータを確認
  console.log('Dashboard Debug:', {
    allSchedules,
    upcomingSchedules,
    scheduleStats,
    schedulesByStatus
  })

  const getPlatformIcon = (platform: string) => {
    const icons = {
      twitter: '🐦',
      reddit: '📮',
      threads: '🧵'
    }
    return icons[platform as keyof typeof icons] || '📱'
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'scheduled': t('status.scheduled'),
      'posted': t('status.posted'),
      'failed': t('status.failed'),
      'cancelled': t('status.cancelled')
    }
    return statusMap[status] || status
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-8 space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                📝
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.importedContent')}</p>
                <p className="text-2xl font-bold">{contentStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                ⭐
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.favorites')}</p>
                <p className="text-2xl font-bold">{contentStats.favorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                📅
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.scheduled')}</p>
                <p className="text-2xl font-bold">{scheduleStats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                ✅
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.posted')}</p>
                <p className="text-2xl font-bold">{scheduleStats.posted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近のコンテンツ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📚 {t('sections.recentContent')}</span>
              <Button size="sm" variant="ghost">{t('actions.viewAll')}</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('messages.noContentYet')}</p>
                  <p className="text-sm">{t('messages.importFirstContent')}</p>
                </div>
              ) : (
                recentContent.slice(0, 5).map(content => (
                  <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{content.title || content.content.metadata.title}</p>
                      <div className="flex gap-1 mt-1">
                        {Object.values(content.content.languages || {})
                          .flatMap(lang => lang.platforms.map(p => p.platform))
                          .filter((platform, index, arr) => arr.indexOf(platform) === index)
                          .map(platform => (
                            <span key={platform} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {getPlatformIcon(platform)} {platform}
                            </span>
                          ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(content.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 近日予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>⏰ {t('sections.upcomingPosts')}</span>
              <Button size="sm" variant="ghost">{t('actions.scheduleMore')}</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('messages.noUpcomingPosts')}</p>
                  <p className="text-sm">{t('messages.scheduleFirstPost')}</p>
                </div>
              ) : (
                upcomingSchedules.slice(0, 5).map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex gap-1 mb-1">
                        {schedule.selected_platforms.map(platform => (
                          <span key={platform} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {getPlatformIcon(platform)} {platform}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(schedule.scheduled_time).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      schedule.status === 'scheduled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 今日の予定 */}
      {todaySchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📅 {t('sections.todaysSchedule')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedules.map(schedule => (
                <div key={schedule.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {new Date(schedule.scheduled_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      schedule.status === 'scheduled' 
                        ? 'bg-blue-100 text-blue-800' 
                        : schedule.status === 'posted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {schedule.selected_platforms.map(platform => (
                      <span key={platform} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {getPlatformIcon(platform)} {platform}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 {t('sections.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                const locale = window.location.pathname.split('/')[1] || 'en'
                window.location.href = `/${locale}/import`
              }}
            >
              <span className="text-2xl">📥</span>
              <span>{t('actions.importContent')}</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                const locale = window.location.pathname.split('/')[1] || 'en'
                window.location.href = `/${locale}/history`
              }}
            >
              <span className="text-2xl">📋</span>
              <span>{t('actions.viewHistory')}</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                const locale = window.location.pathname.split('/')[1] || 'en'
                window.location.href = `/${locale}/schedule`
              }}
            >
              <span className="text-2xl">📅</span>
              <span>{t('actions.schedulePost')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}