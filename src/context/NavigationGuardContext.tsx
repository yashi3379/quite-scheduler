'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface NavigationGuardContextType {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  guardedNavigate: (url: string) => Promise<boolean>
  customMessage?: string
  setCustomMessage: (message?: string) => void
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null)

interface NavigationGuardProviderProps {
  children: ReactNode
}

export function NavigationGuardProvider({ children }: NavigationGuardProviderProps) {
  const router = useRouter()
  const t = useTranslations('common')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [customMessage, setCustomMessage] = useState<string | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const guardedNavigate = useCallback(async (url: string): Promise<boolean> => {
    if (!hasUnsavedChanges) {
      router.push(url)
      return true
    }

    return new Promise((resolve) => {
      setPendingNavigation(url)
      setShowModal(true)
      
      // Store resolve function for modal buttons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__navigationResolve = resolve
    })
  }, [hasUnsavedChanges, router])

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
    setShowModal(false)
    setHasUnsavedChanges(false)
    
    // Resolve the promise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolve = (window as any).__navigationResolve
    if (resolve) {
      resolve(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__navigationResolve = null
    }
  }

  const handleCancelNavigation = () => {
    setPendingNavigation(null)
    setShowModal(false)
    
    // Resolve the promise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolve = (window as any).__navigationResolve
    if (resolve) {
      resolve(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__navigationResolve = null
    }
  }

  const defaultMessage = customMessage || t('unsavedChangesWarning') || 
    'インポートしたデータまたは入力中のデータが削除されます。本当に離れますか？'

  return (
    <NavigationGuardContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        guardedNavigate,
        customMessage,
        setCustomMessage
      }}
    >
      {children}
      
      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">⚠️</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('confirmNavigation') || '画面を離れる確認'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {defaultMessage}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelNavigation}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('stay') || 'このページに留まる'}
                </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('leave') || '離れる'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NavigationGuardContext.Provider>
  )
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext)
  if (!context) {
    throw new Error('useNavigationGuard must be used within NavigationGuardProvider')
  }
  return context
}