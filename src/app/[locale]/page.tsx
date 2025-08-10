import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import WorkflowSteps from '@/components/welcome/WorkflowSteps';
import FeaturesList from '@/components/welcome/FeaturesList';
import SampleDownload from '@/components/welcome/SampleDownload';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale: locale, namespace: 'top'});
 
  const title = t('title');
  const description = t('description');
 
  return {
    title,
    description
  };
}

export default async function TopPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  const t = await getTranslations({locale, namespace: 'top'});
  
  // Get all needed translations
  const title = t('title');
  const subtitle = t('subtitle');
  const description = t('description');
  const getStartedBtn = t('buttons.getStarted');
  const learnMoreBtn = t('buttons.learnMore');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-blue-600 font-medium mb-6">
            {subtitle}
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${locale}/import`} 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              {getStartedBtn}
            </Link>
            <SampleDownload />
          </div>
        </div>

        {/* Workflow Steps */}
        <WorkflowSteps locale={locale} />

        {/* Features */}
        <FeaturesList locale={locale} />

        {/* CTA Section */}
        <div className="text-center mt-16 bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {learnMoreBtn}
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          <Link 
            href={`/${locale}/import`} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>📥</span>
            {getStartedBtn}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 Quite Scheduler. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}