import React, { useState } from 'react'
import { Homepage } from './pages/Homepage'
import { BrowsePage } from './pages/BrowsePage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ThemeProvider } from './components/context/ThemeProvider'
import './index.css'
import ReactDOM from 'react-dom/client'


type Page = 'home' | 'browse' | 'login' | 'register'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const navigate = (page: string, itemId?: number) => {
    if (itemId !== undefined) {
      setSelectedItemId(itemId)
    }
    setCurrentPage(page as Page)
    window.scrollTo(0, 0)
  }

  switch (currentPage) {
    case 'home':
      return <Homepage navigate={navigate} />

    case 'browse':
      return <BrowsePage navigate={navigate} />

    case 'login':
      return <LoginPage navigate={navigate} />

    case 'register':
      return <RegisterPage navigate={navigate} />

    default:
      return <Homepage navigate={navigate} />
  }
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