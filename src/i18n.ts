import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
export const locales = ['en', 'ja'] as const;
export const defaultLocale = 'en' as const;
 
export default getRequestConfig(async ({locale}) => {
  // If locale is undefined, use default locale instead of throwing error
  const validLocale = locale || defaultLocale;
  
  // Validate that the locale parameter is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locales.includes(validLocale as any)) {
    notFound();
  }
  
  try {
    const messages = (await import(`../messages/${validLocale}.json`)).default;
    
    // IMPORTANT: Next.js 15 requires returning both locale and messages
    return { 
      locale: validLocale,
      messages 
    };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    notFound();
  }
});