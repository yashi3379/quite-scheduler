'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
  };

  return (
    <div className="relative">
      <div className="flex bg-white rounded-lg border border-gray-200 p-1">
        <button
          onClick={() => switchLocale('en')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
            locale === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇺🇸 EN
        </button>
        <button
          onClick={() => switchLocale('ja')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
            locale === 'ja'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇯🇵 JP
        </button>
      </div>
    </div>
  );
}