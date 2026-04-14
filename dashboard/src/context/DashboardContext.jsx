import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [asideSection, setAsideSection] = useState('chats')
  const [mainView, setMainView] = useState({ type: 'empty' })

  const openChat = useCallback((userId) => {
    setMainView({ type: 'chat', userId: String(userId) })
  }, [])

  const openNotificationDetail = useCallback((requestId) => {
    setMainView({ type: 'notification', requestId: String(requestId) })
  }, [])

  const openProfile = useCallback(() => {
    setMainView({ type: 'profile' })
  }, [])

  const openUserProfile = useCallback((userId) => {
    setMainView({ type: 'userProfile', userId: String(userId) })
  }, [])

  const clearMain = useCallback(() => {
    setMainView({ type: 'empty' })
  }, [])

  const resetDashboard = useCallback(() => {
    setAsideSection('chats')
    setMainView({ type: 'empty' })
  }, [])

  const value = useMemo(
    () => ({
      asideSection,
      setAsideSection,
      mainView,
      setMainView,
      openChat,
      openNotificationDetail,
      openProfile,
      openUserProfile,
      clearMain,
      resetDashboard
    }),
    [
      asideSection,
      mainView,
      openChat,
      openNotificationDetail,
      openProfile,
      openUserProfile,
      clearMain,
      resetDashboard
    ]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return ctx
}
