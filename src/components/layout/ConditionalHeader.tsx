'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

interface ConditionalHeaderProps {
  locale: string;
}

export default function ConditionalHeader({ locale }: ConditionalHeaderProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname();
  
  // Always show header now (no exceptions)
  return <Header locale={locale} />;
}