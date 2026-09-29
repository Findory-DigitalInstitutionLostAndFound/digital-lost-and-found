import { useEffect } from 'react'
import { authService } from '../services/authService'

export function useHandleEmailConfirmation(navigate: (page: string) => void) {
  useEffect(() => {
    const hash = window.location.hash

    if (hash.includes('access_token')) {
      // convert the hash value to a query string so we can easily extract the access_token
      const params = new URLSearchParams(hash.replace('#', '?'))
      const accessToken = params.get('access_token')

      // Clear the hash from the URL to prevent it from being visible in the address bar
      window.history.replaceState(null, '', window.location.pathname)

      if (accessToken) {
        // Send token to backend to set session cookie
        authService
          .verifyEmailConfirmation(accessToken)
          .then(() => {
            // Navigate after cookie is set
            navigate('home') 
          })
          .catch((err) => {
            console.error('Failed to verify session with backend:', err)
            navigate('login')
          })
      }
    }
  }, [navigate])
}