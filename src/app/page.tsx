import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n'

// ルートページ - デフォルトロケールにリダイレクト
export default function RootPage() {
  redirect(`/${defaultLocale}`)
}