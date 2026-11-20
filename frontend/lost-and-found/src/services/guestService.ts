 import { api } from './api'
 import { type UserInfo } from './authService'

export const guestService = {
    async verifyGuestEmailConfirmation(token: string) {
        // Calls FastAPI endpoint to exchange token for backend session cookie
        const response = await api.post(
            '/guest/verify-email-confirmation',
            { token: token },
            { withCredentials: true }
        )
        return response.data
    },

    //Function to get current user info
    async getCurrentUser(): Promise<UserInfo> {
        const response = await api.get<UserInfo>('/guest/current-user', { withCredentials: true });
            return response.data;
    },
}
