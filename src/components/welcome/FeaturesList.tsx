'use client';

import { useTranslations } from 'next-intl';

interface FeaturesListProps {
  locale: string;
}

export default function FeaturesList({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale 
}: FeaturesListProps) {
  const t = useTranslations('welcome.features');

  const features = [
    {
      icon: '🌐',
      title: t('multiLanguage'),
      description: t('multiLanguageDesc')
    },
    {
      icon: '📱',
      title: t('platforms'),
      description: t('platformsDesc')
    },
    {
      icon: '⏰',
      title: t('scheduling'),
      description: t('schedulingDesc')
    },
    {
      icon: '🔔',
      title: t('notifications'),
      description: t('notificationsDesc')
    },
    {
      icon: '📅',
      title: t('integration'),
      description: t('integrationDesc')
    }
  ];

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        {t('title')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}