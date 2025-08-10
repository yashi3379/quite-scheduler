import { getTranslations } from 'next-intl/server'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale: locale, namespace: 'contact'});
 
  return {
    title: t('title', { defaultValue: 'お問い合わせ - Quite Scheduler' }),
    description: t('description', { defaultValue: 'Quite Schedulerに関するご質問やご要望はこちらからお気軽にお声かけください' })
  };
}

export default async function ContactPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params
  const locale = resolvedParams?.locale || 'en'
  const t = await getTranslations({locale, namespace: 'contact'})

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title', { defaultValue: 'お問い合わせ' })}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('subtitle', { defaultValue: 'ご質問やご要望がございましたら、お気軽にお声かけください' })}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Twitter */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🐦</div>
              <h2 className="text-xl font-semibold">Twitter (X)</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {t('twitter.description', { defaultValue: '最も迅速にお返事できます' })}
            </p>
            <a
              href="https://twitter.com/quite_scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {t('twitter.button', { defaultValue: '@quite_scheduler にメッセージ' })}
            </a>
          </div>

          {/* Reddit */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🔥</div>
              <h2 className="text-xl font-semibold">Reddit</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {t('reddit.description', { defaultValue: '詳細なディスカッションはこちら' })}
            </p>
            <a
              href="https://reddit.com/u/quite_scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              {t('reddit.button', { defaultValue: 'u/quite_scheduler にDM' })}
            </a>
          </div>

          {/* GitHub */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💻</div>
              <h2 className="text-xl font-semibold">GitHub</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {t('github.description', { defaultValue: 'バグレポートや機能リクエストはこちら' })}
            </p>
            <a
              href="https://github.com/quite-scheduler/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
            >
              {t('github.button', { defaultValue: 'Issues を開く' })}
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📧</div>
              <h2 className="text-xl font-semibold">{t('email.title', { defaultValue: 'メール' })}</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {t('email.description', { defaultValue: '公式なお問い合わせはこちら' })}
            </p>
            <a
              href="mailto:support@quite-scheduler.com"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {t('email.button', { defaultValue: 'メールを送信' })}
            </a>
          </div>
        </div>

        {/* よくある質問 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('faq.title', { defaultValue: 'よくある質問' })}
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('faq.pricing.question', { defaultValue: '利用料金はかかりますか？' })}
              </h3>
              <p className="text-gray-600">
                {t('faq.pricing.answer', { 
                  defaultValue: '現在は基本機能を無料でご利用いただけます。Googleカレンダー連携など、すべての機能が無料でお使いいただけます。' 
                })}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('faq.calendar.question', { defaultValue: 'Googleカレンダー連携の設定は必要ですか？' })}
              </h3>
              <p className="text-gray-600">
                {t('faq.calendar.answer', { 
                  defaultValue: '初回利用時にGoogleアカウントでの認証が必要です。認証後は自動的にカレンダーイベントが作成され、設定した通知が届きます。' 
                })}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('faq.features.question', { defaultValue: '新機能のリクエストはできますか？' })}
              </h3>
              <p className="text-gray-600">
                {t('faq.features.answer', { 
                  defaultValue: 'はい！上記のTwitter、Reddit、またはGitHubからお気軽にご提案ください。ユーザーの皆様のフィードバックを大切にしています。' 
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('faq.data.question', { defaultValue: 'データはどこに保存されますか？' })}
              </h3>
              <p className="text-gray-600">
                {t('faq.data.answer', { 
                  defaultValue: 'スケジュール情報はお使いのブラウザ内（localStorage）に安全に保存されます。外部サーバーには送信されないため、プライバシーが保護されます。' 
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('faq.platforms.question', { defaultValue: '対応しているSNSプラットフォームは？' })}
              </h3>
              <p className="text-gray-600">
                {t('faq.platforms.answer', { 
                  defaultValue: '現在Twitter(X)、Reddit、Threadsに対応しています。今後さらに多くのプラットフォームに対応予定です。' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* 免責事項 */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-yellow-800">
            {t('disclaimer.title', { defaultValue: 'ご利用にあたって' })}
          </h3>
          <p className="text-yellow-700 text-sm">
            {t('disclaimer.content', { 
              defaultValue: 'スケジュールされたコンテンツは各プラットフォームの利用規約に従ってご利用ください。また、本サービスはスケジュール管理のみを行い、実際の投稿はユーザー様ご自身で行っていただきます。投稿内容について当サービスは責任を負いかねます。' 
            })}
          </p>
        </div>

        {/* サポート情報 */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-blue-800">
            {t('support.title', { defaultValue: 'サポート情報' })}
          </h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p>• {t('support.hours', { defaultValue: 'サポート対応時間: 平日 9:00-18:00 (JST)' })}</p>
            <p>• {t('support.language', { defaultValue: '対応言語: 日本語、英語' })}</p>
            <p>• {t('support.response', { defaultValue: '通常24時間以内にお返事いたします' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}