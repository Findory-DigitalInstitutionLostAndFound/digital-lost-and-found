import { useEffect } from 'react'
import { authService } from '../services/authService'
import {type UserInfo} from '../services/authService'
import { guestService } from '../services/guestService'

export function useHandleEmailConfirmation(
  navigate: (page: string) => void,
  onSuccess?: (user: UserInfo) => void, 
) {
  useEffect(() => {
    const hash = window.location.hash

    if(!hash.includes('access_token')) {
      return
    }
    
    // convert the hash value to a query string so we can easily extract the access_token
    const params = new URLSearchParams(hash.replace('#', '?'))
    const accessToken = params.get('access_token')
    const type = params.get('type') // This will check if it is a 'recovery' type for password reset or 'signup' for email confirmation

    // Clear the hash from the URL to prevent it from being visible in the address bar
    window.history.replaceState(null, '', window.location.pathname)

    if (!accessToken) {
      return
    }
    console.log('Guest email confirmation verified successfully with backend.')
    // Password recovery
    if (type === 'recovery') {
      sessionStorage.setItem('resetToken', accessToken)
      navigate('login')
      return
    }

    // Guest match link
    if (type === 'guest_match') {
      guestService
        .verifyGuestEmailConfirmation(accessToken)
        .then(async () => {
          const guest = await guestService.getCurrentUser()
          onSuccess?.(guest) // Call the onSuccess callback with guest info
          navigate('dashboard') // Navigate after cookie is set
        })
        .catch((err) => {
          console.error('Failed to verify guest session with backend:', err)
          navigate('login')
        })
      return
    }
    
    // Send token to backend to set session cookie
    authService
      .verifyEmailConfirmation(accessToken)
      .then(async () => {
        const user = await authService.getCurrentUser()
        onSuccess?.(user) // Call the onSuccess callback with user info
        navigate('dashboard') // Navigate after cookie is set
      })
      .catch((err) => {
        console.error('Failed to verify session with backend:', err)
        navigate('login')
      })
  }, [navigate, onSuccess])
}