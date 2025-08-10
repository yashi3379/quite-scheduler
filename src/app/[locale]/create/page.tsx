import { getTranslations } from 'next-intl/server';
import DirectPostCreator from '@/components/create/DirectPostCreator';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale: locale, namespace: 'create'});

  return {
    title: t('title') || '投稿作成',
    description: t('description') || '直接文章を入力してSNS投稿をスケジュールします'
  };
}

export default async function CreatePostPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale, namespace: 'create'});

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title') || '📝 投稿作成'}
          </h1>
          <p className="text-gray-600">
            {t('description') || 'SNSプラットフォームを選択して直接文章を入力し、スケジュールを設定できます'}
          </p>
        </div>

        {/* Direct Post Creator */}
        <DirectPostCreator locale={locale} />
      </div>
    </div>
  );
}