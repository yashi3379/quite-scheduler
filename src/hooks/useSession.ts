'use client'

import { useEffect, useState } from 'react'
import { initializeSession, validateSession, updateSessionActivity } from '@/lib/supabase'

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('')
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const setupSession = async () => {
      try {
        const id = await initializeSession()
        setSessionId(id)
        
        if (id) {
          const valid = await validateSession(id)
          setIsValid(valid)
          
          if (valid) {
            // セッションアクティビティ更新
            await updateSessionActivity(id)
          }
        }
      } catch (error) {
        console.error('Session setup failed:', error)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    setupSession()
  }, [])

  // セッションリフレッシュ
  const refreshSession = async () => {
    if (!sessionId) return false
    
    try {
      const valid = await validateSession(sessionId)
      setIsValid(valid)
      
      if (valid) {
        await updateSessionActivity(sessionId)
      }
      
      return valid
    } catch (error) {
      console.error('Session refresh failed:', error)
      setIsValid(false)
      return false
    }
  }

  return {
    sessionId,
    isValidating,
    isValid,
    refreshSession
  }
}