import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import ChatsHome from '../../pages/ChatsHome/ChatsHome'
import ChatRoom from '../../pages/ChatRoom/ChatRoom'
import NotificationDetail from '../../pages/NotificationDetail/NotificationDetail'
import Profile from '../../pages/Profile/Profile'
import UserProfile from '../../pages/UserProfile/UserProfile'

const MainStage = () => {
  const { mainView } = useDashboard()

  switch (mainView.type) {
    case 'chat':
      return <ChatRoom userId={mainView.userId} />
    case 'notification':
      return <NotificationDetail requestId={mainView.requestId} />
    case 'profile':
      return <Profile />
    case 'userProfile':
      return <UserProfile userId={mainView.userId} />
    case 'empty':
    default:
      return <ChatsHome />
  }
}

export default MainStage
