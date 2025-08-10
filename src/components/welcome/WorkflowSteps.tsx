'use client';

import { useTranslations } from 'next-intl';

interface WorkflowStepsProps {
  locale: string;
}

export default function WorkflowSteps({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale 
}: WorkflowStepsProps) {
  const t = useTranslations('top.workflow');

  const steps = [
    {
      number: 1,
      icon: '📥',
      title: t('step1.title'),
      description: t('step1.description'),
    },
    {
      number: 2,
      icon: '📅',
      title: t('step2.title'),
      description: t('step2.description'),
    },
    {
      number: 3,
      icon: '🔗',
      title: t('step3.title'),
      description: t('step3.description'),
    },
    {
      number: 4,
      icon: '🔔',
      title: t('step4.title'),
      description: t('step4.description'),
    },
    {
      number: 5,
      icon: '📋',
      title: t('step5.title'),
      description: t('step5.description'),
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        {t('title')}
      </h2>
      
      {/* First row - 3 steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
        {steps.slice(0, 3).map((step, 
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          index) => (
          <div key={step.number}>
            {/* Step Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 h-56 flex flex-col transition-transform hover:scale-105 hover:shadow-xl">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center -mt-1">
                  <span className="text-sm font-bold">{step.number}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col text-center">
                <h3 className="font-bold text-gray-900 mb-3 text-base leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Second row - 2 steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {steps.slice(3, 5).map((step, 
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          index) => (
          <div key={step.number}>
            {/* Step Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 h-56 flex flex-col transition-transform hover:scale-105 hover:shadow-xl">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center -mt-1">
                  <span className="text-sm font-bold">{step.number}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col text-center">
                <h3 className="font-bold text-gray-900 mb-3 text-base leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}