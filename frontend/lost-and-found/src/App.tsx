import { useState, useEffect } from 'react'
import { Homepage } from './pages/Homepage'
import { BrowsePage } from './pages/BrowsePage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { MatchesPage } from './pages/MatchesPage'
import { useMatches } from './hooks/useMatches'
import { ReportItemPage } from './pages/ReportItemPage'
import { ClaimsPage } from './pages/ClaimsPage'
import { ProfilePage } from './pages/ProfilePage'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ThemeProvider } from './components/context/ThemeProvider'
import { useHandleEmailConfirmation } from './hooks/useHandleEmailConfirmation'
import { authService } from './services/authService'
import { claimsService } from './services/claimMessageService'
// @ts-ignore Vite handles CSS side-effect imports at runtime.
import './index.css'
import { GuestPage } from './pages/GuestPage'
import { type UserInfo } from './services/authService'
import { guestService } from './services/guestService'
import { AdminPage } from './pages/AdminPage'


type Page = 'dashboard' | 'home' | 'browse' | 'login' | 'register' | 'matches' | 'report-lost' | 'report-found' | 'guest' | 'claims' | 'profile' | 'admin'

function AppContent() {
  const getInitialPage = (): Page => {
    const path = window.location.pathname.replace('/', '') as Page
    const validPages: Page[] = ['dashboard', 'home', 'browse', 'login', 'register', 'matches', 'report-lost', 'report-found', 'guest', 'claims', 'profile', 'admin']
    return validPages.includes(path) ? path : 'home'
  }
  
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage())
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [pendingClaimsCount, setPendingClaimsCount] = useState<number>(0)

  // Start with user as null, will be set after login or registration
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  //Track explicitly when the active session belongs to a logged-in guest link user
  const isGuestSession = user?.role === 'guest'

  const matching = useMatches(isGuestSession ? undefined : user?.user_id)
  const pendingMatchesCount = matching.pendingCount
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '') as Page
      const validPages: Page[] = ['dashboard', 'home', 'browse', 'login', 'register', 'matches', 'report-lost', 'report-found', 'guest', 'claims', 'profile']
      if (validPages.includes(path)) {
        setCurrentPage(path)
      } else {
        setCurrentPage('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (page: string, itemId?: number) => {
    if (itemId !== undefined) {
      setSelectedItemId(itemId)
    }
    const targetPage = page as Page
    setCurrentPage(targetPage)
    
    // Sync the browser URL with the current page state
    const newPath = targetPage === 'home' ? '/' : `/${targetPage}`
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath)
    }

    window.scrollTo(0, 0)
  }

  // Function to fetch unread claims count from backend
  const refreshPendingCounts = async () => {
    if (!user || isGuestSession) {
      setPendingClaimsCount(0)
      return
    }
    try {
      const claimsData = await claimsService.getClaims()
      const allClaims = [...claimsData.claims_as_claimant, ...claimsData.claims_as_founder]
      const unreadCount = allClaims.filter(c => c.is_unread).length
      setPendingClaimsCount(unreadCount)
    } catch (err) {
      console.error('Failed to fetch pending counts:', err)
    }
  }

  // Refresh counts on session load and page navigation
  useEffect(() => {
    refreshPendingCounts()
  }, [currentPage, user])

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
        try {
          const guestUser = await guestService.getCurrentUser()
          setUser(guestUser)
        } catch {
          setUser(null)
        } 
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    try{
      if (isGuestSession) {
        await guestService.logout() //When signing out of a guest session so the guest cookie is cleared
      } else {
      await authService.userLogout() //backend delete the cookie
      }
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setUser(null)
      navigate('login')
    }
  }

  // Function to handle account deletion
  const handleDeleteAccount = async () => {
  try {
    await authService.deleteUserAccount()
    try {
      await authService.userLogout()
    } catch {
    }
    setUser(null)
    navigate('home')
  } catch (err) {
    console.error('Failed to delete account:', err)
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
  const isPublicPage = currentPage === 'login' || currentPage === 'register' || currentPage === 'home' || currentPage === 'guest' || currentPage === 'report-lost' 
  const pageProps = { navigate, selectedItemId, user} as any

  //Protect route guard
  const renderPageView = () => {
    // If user is not logged in and trying to access a protected page, redirect to login
    if (!user && !isPublicPage) {
      return <Homepage {...pageProps} />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} isGuest={isGuestSession} />
      case 'home':
        return <Homepage {...pageProps} />
      case 'browse':
        return <BrowsePage {...pageProps} />
      case 'matches':
        return <MatchesPage controller={matching} />
      case 'guest':
        return <GuestPage {...pageProps} />
      case 'claims':
        return <ClaimsPage {...pageProps} refreshCounts={refreshPendingCounts} />
      case 'report-lost':
        //  Block logged-in guest link users from creating more reports, while keeping unauthenticated (!user) guest reporting intact
        if (isGuestSession) {
          return <Dashboard {...pageProps} isGuest={true} />
        }
        return <ReportItemPage mode="lost" navigate={navigate} isGuest={!user} />
      case 'report-found':
        //  Block logged-in guest link users from accessing report-found
        if (isGuestSession) {
          return <Dashboard {...pageProps} isGuest={true} />
        }
        return <ReportItemPage mode="found" navigate={navigate} isGuest={false} />
      case 'profile':
        // Block logged-in guest link users from accessing profile
        if (isGuestSession) {
          return <Dashboard {...pageProps} isGuest={true} />
        }
        return (
          <ProfilePage
            user={user}
            navigate={navigate}
            onDeleteAccount={handleDeleteAccount}
          />
        )
      case 'login':
        return <LoginPage 
          navigate={navigate} 
          onLoginSuccess={(user) => setUser(user)}     
        />
      case 'register':
        return <RegisterPage {...pageProps} />
      case 'admin':
        // only admins can access the admin page
        if (user?.uni_role !== 'admin') {
          console.log('user lole at case', user?.uni_role)
          return <Dashboard {...pageProps} isGuest={isGuestSession} />
        }
        return <AdminPage navigate={navigate} user={user} />
      default:
        return <Dashboard {...pageProps} isGuest={isGuestSession}/>
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
        pendingClaimsCount={pendingClaimsCount}
        isGuest={isGuestSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          currentPage={currentPage} 
          navigate={navigate} 
          pendingMatchesCount={pendingMatchesCount}
          pendingClaimsCount={pendingClaimsCount}
          isGuest={isGuestSession}
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
