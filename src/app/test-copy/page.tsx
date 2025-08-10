'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { generateAccessURL } from '@/lib/copy'

export default function TestCopyPage() {
  const [scheduleId, setScheduleId] = useState('')
  const [accessURL, setAccessURL] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateURL = async () => {
    if (!scheduleId.trim()) {
      alert('Please enter a schedule ID')
      return
    }

    setIsGenerating(true)
    try {
      const url = await generateAccessURL(scheduleId)
      setAccessURL(url)
    } catch (error) {
      console.error('Failed to generate URL:', error)
      alert('Failed to generate URL')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseTestData = () => {
    const testId = `schedule_test_${Date.now()}`
    setScheduleId(testId)
  }

  const handleOpenURL = () => {
    if (accessURL) {
      window.open(accessURL, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📋 Copy Page Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the secure copy page functionality. Generate access URLs and test the token-based authentication system.
          </p>
        </div>

        <div className="space-y-6">
          {/* URL Generator */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Generate Test Access URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule ID
                </label>
                <div className="flex gap-2">
                  <Input
                    value={scheduleId}
                    onChange={(e) => setScheduleId(e.target.value)}
                    placeholder="Enter schedule ID (e.g., schedule_test_123)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={handleUseTestData}
                    className="whitespace-nowrap"
                  >
                    Use Test ID
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGenerateURL}
                loading={isGenerating}
                disabled={!scheduleId.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : '🔗 Generate Access URL'}
              </Button>

              {accessURL && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Access URL
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-sm font-mono text-gray-800 break-all">
                        {accessURL}
                      </code>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(accessURL)}
                        >
                          📋 Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleOpenURL}
                        >
                          🔗 Open
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test URLs */}
          <Card>
            <CardHeader>
              <CardTitle>🧪 Pre-built Test URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Valid Test Link</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    This link uses a valid schedule ID and token format that will work with the mock data.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const testURL = `/copy/schedule_test_${Date.now()}?token=token_valid_${Date.now()}`
                      window.open(testURL, '_blank')
                    }}
                    className="w-full justify-start"
                  >
                    🔗 Open Valid Test Link
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Invalid Token Test</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    This link will demonstrate the error handling for invalid tokens.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const testURL = '/copy/invalid_schedule?token=invalid_token'
                      window.open(testURL, '_blank')
                    }}
                    className="w-full justify-start"
                  >
                    ❌ Open Invalid Token Test
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Missing Token Test</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    This link will demonstrate the access required page.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const testURL = '/copy/some_schedule'
                      window.open(testURL, '_blank')
                    }}
                    className="w-full justify-start"
                  >
                    🔒 Open Missing Token Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>📖 How to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">1. Generate Access URL</h4>
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  <p>Enter a schedule ID or use the "Use Test ID" button to generate a test URL with a valid token.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">2. Test Copy Functionality</h4>
                  <p>Click on any content area or copy button to test the clipboard functionality. The system will show visual feedback when content is copied.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">3. Test Error Cases</h4>
                  <p>Use the pre-built test URLs to verify error handling for invalid tokens and missing authentication.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">4. Mobile Testing</h4>
                  <p>Open the copy page on a mobile device to test the responsive design and touch-friendly interface.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}