'use client'

import { useEffect } from 'react'
import { useNavigationGuard } from '@/context/NavigationGuardContext'

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setHasUnsavedChanges, setCustomMessage } = useNavigationGuard()

  useEffect(() => {
    // Listen for form changes in the create page
    const handleFormChange = (event: CustomEvent) => {
      setHasUnsavedChanges(event.detail.hasChanges)
    }

    setCustomMessage('入力中の投稿内容が削除されます。本当にこのページから離れますか？')

    window.addEventListener('create-form-changed', handleFormChange as EventListener)
    
    return () => {
      window.removeEventListener('create-form-changed', handleFormChange as EventListener)
    }
  }, [setHasUnsavedChanges, setCustomMessage])

  return <>{children}</>
}