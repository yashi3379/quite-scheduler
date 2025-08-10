'use client'

import { useAtom } from 'jotai'
import { schedulesAtom } from '@/atoms/scheduleAtoms'
import CopyPageContent from './CopyPageContent'

interface CopyPageWrapperProps {
  scheduleId: string
}

export default function CopyPageWrapper({ scheduleId }: CopyPageWrapperProps) {
  const [schedules] = useAtom(schedulesAtom)
  
  // スケジュールIDからスケジュールデータを取得
  const schedule = schedules.find(s => s.id === scheduleId)
  
  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule Not Found</h1>
          <p className="text-gray-600 mb-4">
            The requested schedule could not be found in your current session.
          </p>
          <div className="bg-yellow-50 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-900 mb-2">💡 Try this:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Make sure you created the schedule in this session</li>
              <li>• Check if the schedule ID is correct</li>
              <li>• Create a new schedule if needed</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CopyPageContent 
      schedule={schedule}
      content={schedule.imported_content}
    />
  )
}