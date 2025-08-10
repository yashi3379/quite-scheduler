'use client'

import { useState } from 'react'
import { testDatabaseConnection, testSupabaseEnvironment } from '@/lib/database-test'

export default function TestDbPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const runTests = async () => {
    setIsConnecting(true)
    setResults([])
    
    const logs: string[] = []
    
    // コンソールをキャプチャー
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalConsoleLog(...args)
    }
    
    console.error = (...args) => {
      logs.push('ERROR: ' + args.join(' '))
      originalConsoleError(...args)
    }
    
    try {
      // 環境変数テスト
      const envTest = await testSupabaseEnvironment()
      logs.push(`Environment test: ${envTest ? '✅ PASSED' : '❌ FAILED'}`)
      
      // データベース接続テスト
      const dbTest = await testDatabaseConnection()
      logs.push(`Database test: ${dbTest ? '✅ PASSED' : '❌ FAILED'}`)
      
    } catch (error) {
      logs.push(`Test error: ${error}`)
    } finally {
      // コンソールを復元
      console.log = originalConsoleLog
      console.error = originalConsoleError
      
      setResults(logs)
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={runTests}
            disabled={isConnecting}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isConnecting ? 'Testing...' : 'Run Database Tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
            <h2 className="text-white mb-2">Test Results:</h2>
            {results.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}