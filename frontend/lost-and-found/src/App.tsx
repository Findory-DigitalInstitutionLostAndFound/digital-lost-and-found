import React, { useState, useEffect } from 'react'
import { Homepage } from './pages/Homepage'
import { BrowsePage } from './pages/BrowsePage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { MatchesPage } from './pages/MatchesPage'
import { ReportItemPage } from './pages/ReportItemPage'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ThemeProvider } from './components/context/ThemeProvider'
import { useHandleEmailConfirmation } from './hooks/useHandleEmailConfirmation'
import { authService } from './services/authService'
import './index.css'
import ReactDOM from 'react-dom/client'


type Page = 'dashboard' | 'home' | 'browse' | 'login' | 'register' | 'matches' | 'report-lost' | 'report-found'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [pendingMatchesCount] = useState<number>(1)

  // Start with user as null, will be set after login or registration
  const [user, setUser] = useState<{ name: string; email: string; phone: string; user_id: string } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = (page: string, itemId?: number) => {
    if (itemId !== undefined) {
      setSelectedItemId(itemId)
    }
    setCurrentPage(page as Page)
    window.scrollTo(0, 0)
  }

  //Automatically  clean access token from URL after email confirmation to prevent it from being visible in the address bar
  useHandleEmailConfirmation(navigate, (confirmedUser) => {
    setUser(confirmedUser)
  })

  // Check active session cookie with fastapi backend on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        setUser(null) 
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    try{
      await authService.userLogout() //backend delete the cookie
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setUser(null)
      navigate('login')
    }
  }

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EC] text-[#0E0D0B]">
        <div className="text-center font-medium">Loading session...</div>
      </div>
    )
  }

  // Define public pages that don't require authentication
  const isPublicPage = currentPage === 'login' || currentPage === 'register' || currentPage === 'home'
  const pageProps = { navigate, selectedItemId } as any

  //Protect route guard
  const renderPageView = () => {
    // If user is not logged in and trying to access a protected page, redirect to login
    if (!user && !isPublicPage) {
      return <Homepage {...pageProps} />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />
      case 'home':
        return <Homepage {...pageProps} />
      case 'browse':
        return <BrowsePage {...pageProps} />
      case 'matches':
        return <MatchesPage {...pageProps} />
      case 'report-lost':
        return <ReportItemPage mode="lost" navigate={navigate} />
      case 'report-found':
        return <ReportItemPage mode="found" navigate={navigate} />
      case 'login':
        return <LoginPage 
          navigate={navigate} 
          onLoginSuccess={(user) => setUser(user)}     
        />
      case 'register':
        return <RegisterPage {...pageProps} />
      default:
        return <Dashboard {...pageProps} />
    }
  }

  // Hide sidebar/header on unauthenticated pages (login, register, home landing)
  const isAuthOrLandingPage = currentPage === 'login' || currentPage === 'register' || currentPage === 'home' || !user

  if (isAuthOrLandingPage) {
    return (
      <div className="min-h-screen bg-[#FAF6EC] text-[#0E0D0B]">
        {renderPageView()}
      </div>
    )
  }

  // Main layout wrapper with persistent Sidebar and Header for authenticated views
  return (
    <div className="flex min-h-screen bg-[#FAF6EC] text-[#0E0D0B]">
      {/* Persistent Dark Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        navigate={navigate} 
        user={user}
        logout={handleLogout}
        pendingMatchesCount={pendingMatchesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          currentPage={currentPage} 
          navigate={navigate} 
          pendingMatchesCount={pendingMatchesCount}
        />
        <main className="flex-1">
          {renderPageView()}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)