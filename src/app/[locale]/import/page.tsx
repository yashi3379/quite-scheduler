import { getTranslations } from 'next-intl/server'
import JSONImporter from '@/components/schedule/JSONImporter'
import ImportPreview from '@/components/schedule/ImportPreview'

export default async function ImportPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params
  const locale = resolvedParams?.locale || 'en'
  const t = await getTranslations({locale, namespace: 'import'})

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>
        
        <div className="space-y-8">
          <JSONImporter locale={locale} />
          <ImportPreview locale={locale} />
        </div>
      </div>
    </div>
  )
}