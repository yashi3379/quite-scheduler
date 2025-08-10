import { getTranslations } from 'next-intl/server'
import SimplePostScheduler from '@/components/schedule/SimplePostScheduler'

export default async function SchedulePage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params
  const locale = resolvedParams?.locale || 'en'
  const t = await getTranslations({locale, namespace: 'schedule'})

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>
        
        <SimplePostScheduler locale={locale} />
      </div>
    </div>
  )
}