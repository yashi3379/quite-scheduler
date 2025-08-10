import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import JotaiProvider from '@/components/providers/JotaiProvider';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import { NavigationGuardProvider } from '@/context/NavigationGuardContext';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quite Scheduler - SNS Content Scheduling Platform",
  description: "Efficiently schedule and manage your social media content with our streamlined workflow.",
};

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  const messages = await getMessages({locale});

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quite Scheduler" />
        {/* Disable caching */}
        <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <JotaiProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GoogleAuthProvider>
              <NavigationGuardProvider>
                <ConditionalHeader locale={locale} />
                <main>
                  {children}
                </main>
              </NavigationGuardProvider>
            </GoogleAuthProvider>
          </NextIntlClientProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}