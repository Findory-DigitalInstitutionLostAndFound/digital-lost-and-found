import React, { useState } from 'react'
import { Homepage } from './pages/Homepage'
import { BrowsePage } from './pages/BrowsePage'
import { ThemeProvider } from './components/context/ThemeProvider'
import './index.css'
import ReactDOM from 'react-dom/client'

type Page = 'home' | 'browse' 

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const navigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  switch (currentPage) {
    case 'home':
      return <Homepage navigate={navigate} />

    case 'browse':
      return <BrowsePage navigate={(page) => setCurrentPage(page as Page)} />

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