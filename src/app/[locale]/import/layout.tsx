'use client'

import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { importedContentAtom, selectedContentAtom, selectedPlatformsAtom } from '@/atoms/scheduleAtoms'
import { useNavigationGuard } from '@/context/NavigationGuardContext'

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [importedContent] = useAtom(importedContentAtom)
  const [selectedContent] = useAtom(selectedContentAtom)
  const [selectedPlatforms] = useAtom(selectedPlatformsAtom)
  const { setHasUnsavedChanges, setCustomMessage } = useNavigationGuard()

  // Update unsaved changes status
  useEffect(() => {
    const hasUnsavedChanges = Boolean(
      importedContent || 
      selectedContent ||
      selectedPlatforms?.length > 1 // Default is ['twitter'], so more than 1 means changes
    )
    
    setHasUnsavedChanges(hasUnsavedChanges)
    setCustomMessage('インポートしたコンテンツが削除されます。本当にこのページから離れますか？')
  }, [importedContent, selectedContent, selectedPlatforms, setHasUnsavedChanges, setCustomMessage])

  return <>{children}</>
}