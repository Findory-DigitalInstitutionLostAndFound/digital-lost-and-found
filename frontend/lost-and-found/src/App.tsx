import React, { useState } from 'react'
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
import './index.css'
import ReactDOM from 'react-dom/client'

type Page = 'dashboard' | 'home' | 'browse' | 'login' | 'register' | 'matches' | 'report-lost' | 'report-found'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [pendingMatchesCount] = useState<number>(1)

  // Mock user state (null if logged out, object if signed in)
  const [user, setUser] = useState<{ name: string; email: string } | null>({
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
  })

  const navigate = (page: string, itemId?: number) => {
    if (itemId !== undefined) {
      setSelectedItemId(itemId)
    }
    setCurrentPage(page as Page)
    window.scrollTo(0, 0)
  }

  const handleLogout = () => {
    setUser(null)
    navigate('login')
  }

  const pageProps = { navigate, selectedItemId } as any

  const renderPageView = () => {
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
        return <LoginPage {...pageProps} />
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