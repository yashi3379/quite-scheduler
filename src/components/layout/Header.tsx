'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useNavigationGuard } from '@/context/NavigationGuardContext'

interface HeaderProps {
  locale: string
}

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations('navigation')
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { guardedNavigate } = useNavigationGuard()

  const navigationItems = [
    {
      href: `/${locale}/dashboard`,
      label: t('dashboard', { defaultValue: 'ダッシュボード' }),
      icon: '📊',
      description: t('dashboardDesc', { defaultValue: '概要とスケジュール確認' })
    },
    {
      href: `/${locale}/create`,
      label: t('create', { defaultValue: '投稿作成' }),
      icon: '✏️',
      description: t('createDesc', { defaultValue: '直接投稿を作成' })
    },
    {
      href: `/${locale}/import`,
      label: t('import', { defaultValue: 'インポート' }),
      icon: '📥',
      description: t('importDesc', { defaultValue: 'コンテンツをインポート' })
    },
    {
      href: `/${locale}/history`,
      label: t('history', { defaultValue: '履歴' }),
      icon: '📋',
      description: t('historyDesc', { defaultValue: '投稿履歴を確認' })
    },
    {
      href: `/${locale}/notifications`,
      label: t('notifications', { defaultValue: '通知設定' }),
      icon: '🔔',
      description: t('notificationsDesc', { defaultValue: 'カレンダー通知設定' })
    },
    {
      href: `/${locale}/contact`,
      label: t('contact', { defaultValue: 'お問い合わせ' }),
      icon: '💬',
      description: t('contactDesc', { defaultValue: 'サポートとお問い合わせ' })
    }
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">QS</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Quite Scheduler</h1>
              <p className="text-xs text-gray-500">{t('tagline', { defaultValue: 'SNS投稿スケジューラー' })}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => guardedNavigate(item.href)}
                className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.description}
                </div>
              </button>
            ))}
          </nav>

          {/* Language Switcher & Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Link
                href={pathname.replace(/^\/[^\/]+/, '/en')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  locale === 'en' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </Link>
              <Link
                href={pathname.replace(/^\/[^\/]+/, '/ja')}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  locale === 'ja' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                JP
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="py-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    guardedNavigate(item.href)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div>{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}