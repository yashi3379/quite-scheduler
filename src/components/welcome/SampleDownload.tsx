'use client';

import { useTranslations } from 'next-intl';

export default function SampleDownload() {
  const t = useTranslations('welcome');

  const downloadSample = () => {
    const sampleData = {
      version: "1.0",
      created_at: new Date().toISOString(),
      content_id: "sample-001",
      metadata: {
        title: "Sample Social Media Post",
        category: "tech",
        tags: ["nextjs", "react", "javascript"],
        priority: "medium"
      },
      languages: {
        english: {
          platforms: [
            {
              platform: "twitter",
              content: "🚀 Excited to share our latest Next.js project! Built with modern React patterns and optimized for performance. Check it out! #NextJS #React #WebDev",
              metadata: {
                tokens: 1250,
                cost: 0.0025,
                model: "gpt-4o-mini",
                originalLength: 145,
                finalLength: 140
              }
            },
            {
              platform: "reddit",
              content: "Hey r/nextjs! Just finished building a social media scheduling app with Next.js 15 and the new App Router. The performance improvements are incredible!\n\nKey features:\n- Server-side rendering with streaming\n- Optimized bundle splitting\n- Edge runtime support\n\nHappy to answer any questions about the implementation!",
              metadata: {
                tokens: 2100,
                cost: 0.0042,
                model: "gpt-4o-mini",
                originalLength: 285,
                finalLength: 280
              }
            }
          ]
        },
        japanese: {
          platforms: [
            {
              platform: "twitter",
              content: "🚀 最新のNext.jsプロジェクトをシェアします！モダンなReactパターンで構築し、パフォーマンスを最適化しました。ぜひチェックしてください！#NextJS #React #WebDev",
              metadata: {
                tokens: 1180,
                cost: 0.0024,
                model: "gpt-4o-mini", 
                originalLength: 98,
                finalLength: 95
              }
            }
          ]
        }
      }
    };

    const dataStr = JSON.stringify(sampleData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'quite-post-sample.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <button
      onClick={downloadSample}
      className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2"
    >
      <span>📥</span>
      {t('buttons.downloadSample')}
    </button>
  );
}