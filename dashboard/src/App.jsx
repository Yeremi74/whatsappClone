import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardProvider } from './context/DashboardContext'
import DashboardLogin from './pages/DashboardLogin/DashboardLogin'
import NavbarAdmin from './components/NavbarAdmin/NavbarAdmin'
import MainStage from './components/MainStage/MainStage'
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
        <MainStage />
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <Routes>
          <Route path="/login" element={<DashboardLogin />} />
          <Route path="/register" element={<DashboardLogin />} />
          <Route path="/" element={<ProtectedLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardProvider>
    </ThemeProvider>
  )
}

export default App
