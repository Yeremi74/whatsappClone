import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'
import DashboardLogin from './pages/DashboardLogin/DashboardLogin'
import Profile from './pages/Profile/Profile'
import NavbarAdmin from './components/NavbarAdmin/NavbarAdmin'
import UserProfile from './pages/UserProfile/UserProfile'
import ChatRoom from './pages/ChatRoom/ChatRoom'
import ChatsHome from './pages/ChatsHome/ChatsHome'
import ContactsHome from './pages/ContactsHome/ContactsHome'
import NotificationsHome from './pages/NotificationsHome/NotificationsHome'
import SettingsHome from './pages/SettingsHome/SettingsHome'
import NotificationDetail from './pages/NotificationDetail/NotificationDetail'
import appShellStyles from './components/AppShell/AppShell.module.css'

const ProtectedLayout = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return (
    <div className={appShellStyles.appShell}>
      <NavbarAdmin />
      <main className={appShellStyles.mainStage}>
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<DashboardLogin />} />
        <Route path="/register" element={<DashboardLogin />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/chats" replace />} />
          <Route path="/chats" element={<ChatsHome />} />
          <Route path="/contacts" element={<ContactsHome />} />
          <Route path="/chat/:userId" element={<ChatRoom />} />
          <Route path="/notifications" element={<NotificationsHome />} />
          <Route path="/notifications/:requestId" element={<NotificationDetail />} />
          <Route path="/settings" element={<SettingsHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/:id" element={<UserProfile />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App
