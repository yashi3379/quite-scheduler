// 状態管理用のカスタムフック
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  // セッション関連
  sessionIdAtom,
  isSessionValidAtom,
  sessionSettingsWithPersistenceAtom,
  
  // コンテンツ関連
  contentHistoryAtom,
  currentContentAtom,
  favoriteContentAtom,
  recentContentAtom,
  contentStatsAtom,
  isImportingAtom,
  importErrorAtom,
  addToHistoryAtom,
  toggleFavoriteAtom,
  removeFromHistoryAtom,
  
  // スケジュール関連
  schedulesAtom,
  upcomingSchedulesAtom,
  pastSchedulesAtom,
  schedulesByStatusAtom,
  scheduleStatsAtom,
  selectedContentAtom,
  selectedLanguageAtom,
  selectedPlatformsAtom,
  isSchedulingAtom,
  schedulingErrorAtom,
  addScheduleAtom,
  updateScheduleStatusAtom,
  removeScheduleAtom,
  
  // UI関連
  notificationsAtom,
  addNotificationAtom,
  removeNotificationAtom,
  sidebarOpenAtom,
  toggleSidebarAtom,
  themeAtom,
  setThemeAtom
} from '@/atoms'

// セッション関連フック
export const useSession = () => {
  const sessionId = useAtomValue(sessionIdAtom)
  const isValid = useAtomValue(isSessionValidAtom)
  const [settings, updateSettings] = useAtom(sessionSettingsWithPersistenceAtom)
  
  return {
    sessionId,
    isValid,
    settings,
    updateSettings
  }
}

// コンテンツ関連フック
export const useContent = () => {
  const history = useAtomValue(contentHistoryAtom)
  const current = useAtomValue(currentContentAtom)
  const favorites = useAtomValue(favoriteContentAtom)
  const recent = useAtomValue(recentContentAtom)
  const stats = useAtomValue(contentStatsAtom)
  const isImporting = useAtomValue(isImportingAtom)
  const error = useAtomValue(importErrorAtom)
  
  const addToHistory = useSetAtom(addToHistoryAtom)
  const toggleFavorite = useSetAtom(toggleFavoriteAtom)
  const removeFromHistory = useSetAtom(removeFromHistoryAtom)
  
  return {
    history,
    current,
    favorites,
    recent,
    stats,
    isImporting,
    error,
    addToHistory,
    toggleFavorite,
    removeFromHistory
  }
}

// スケジュール関連フック
export const useSchedule = () => {
  const schedules = useAtomValue(schedulesAtom)
  const upcoming = useAtomValue(upcomingSchedulesAtom)
  const past = useAtomValue(pastSchedulesAtom)
  const byStatus = useAtomValue(schedulesByStatusAtom)
  const stats = useAtomValue(scheduleStatsAtom)
  const isScheduling = useAtomValue(isSchedulingAtom)
  const error = useAtomValue(schedulingErrorAtom)
  
  const addSchedule = useSetAtom(addScheduleAtom)
  const updateStatus = useSetAtom(updateScheduleStatusAtom)
  const removeSchedule = useSetAtom(removeScheduleAtom)
  
  return {
    schedules,
    upcoming,
    past,
    byStatus,
    stats,
    isScheduling,
    error,
    addSchedule,
    updateStatus,
    removeSchedule
  }
}

// スケジューリングフォーム関連フック
export const useSchedulingForm = () => {
  const [selectedContent, setSelectedContent] = useAtom(selectedContentAtom)
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom)
  const [selectedPlatforms, setSelectedPlatforms] = useAtom(selectedPlatformsAtom)
  
  return {
    selectedContent,
    setSelectedContent,
    selectedLanguage,
    setSelectedLanguage,
    selectedPlatforms,
    setSelectedPlatforms
  }
}

// 通知関連フック
export const useNotifications = () => {
  const notifications = useAtomValue(notificationsAtom)
  const addNotification = useSetAtom(addNotificationAtom)
  const removeNotification = useSetAtom(removeNotificationAtom)
  
  return {
    notifications,
    addNotification,
    removeNotification
  }
}

// UI状態関連フック
export const useUI = () => {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const toggleSidebar = useSetAtom(toggleSidebarAtom)
  const [theme] = useAtom(themeAtom)
  const updateTheme = useSetAtom(setThemeAtom)
  
  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    theme,
    setTheme: updateTheme
  }
}