import { getTranslations } from 'next-intl/server';
import GoogleCalendarNotificationSettings from '@/components/notifications/GoogleCalendarNotificationSettings';
import Link from 'next/link';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale: locale, namespace: 'notifications'});
 
  return {
    title: t('title') || '通知設定',
    description: t('description') || 'プッシュ通知の設定を管理します'
  };
}

export default async function NotificationsPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale, namespace: 'notifications'});
  const commonT = await getTranslations({locale, namespace: 'common'});

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← {commonT('back') || '戻る'}
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title') || '🔔 通知設定'}
          </h1>
          <p className="text-gray-600">
            {t('description') || 'スケジュールされた投稿の通知を設定します'}
          </p>
        </div>

        {/* Notification Settings */}
        <div className="space-y-6">
          <GoogleCalendarNotificationSettings />
          
          {/* Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('calendarIntegrationInfo') || '📋 Googleカレンダー連携について'}
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('whatThisDoes') || 'この機能について'}
                </h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('directControl') || 'Googleカレンダーの通知設定を直接制御します'}</li>
                  <li>{t('noAppNotifications') || 'アプリ独自の通知は使用しません'}</li>
                  <li>{t('realTimeSync') || '設定変更は即座にカレンダーに反映されます'}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('requirements') || '要件'}
                </h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('googleAccount') || 'Googleアカウント'}</li>
                  <li>{t('calendarAccess') || 'Googleカレンダーへのアクセス許可'}</li>
                  <li>{t('requirement3') || 'インターネット接続'}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('privacy') || 'プライバシー'}
                </h3>
                <p>
                  {t('privacyDescCalendar') || '通知設定はGoogleカレンダーに直接保存され、アプリには保存されません。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}