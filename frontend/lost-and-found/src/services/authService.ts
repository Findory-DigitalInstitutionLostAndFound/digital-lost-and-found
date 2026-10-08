import {api} from "./api";

// Define the types for the request and response data
export type RegisterData = {
    name: string;
    email: string;
    phone: string;
    password: string;
};

export type LoginData = {
    email: string;
    password: string;
};

export type MessageResponse = {
    message: string;
};

export type UserInfo = {
  user_id: string,
  email: string,
  name: string,
  phone: string
};

export type ForgotPasswordData = {
    email: string;
    redirect_to: string;
};

export type ResetPasswordData = {
    access_token: string;
    new_password: string;
};

export const authService = {
    // Function to register a new user
    async userRegister(data: RegisterData): Promise<MessageResponse> {
        const response = await api.post<MessageResponse>('/auth/register', data);
        return response.data;
    },

    // Function to login a user
    async userLogin(data: LoginData): Promise<MessageResponse> {
        const response = await api.post<MessageResponse>('/auth/login', data);
        return response.data;
    },

    // Function to logout a user
    async userLogout(): Promise<MessageResponse> {
        const response = await api.post<MessageResponse>('/auth/logout');
        return response.data;
    },

    async verifyEmailConfirmation(supabaseToken: string) {
        // Calls FastAPI endpoint to exchange Supabase token for backend session cookie
        const response = await api.post(
            '/auth/supabase-callback',
            { token: supabaseToken },
            { withCredentials: true }
        )
        return response.data
    },

    //Function to get current user info
    async getCurrentUser(): Promise<UserInfo> {
        const response = await api.get<{
            user_id: string;
            email: string;
            full_name: string;
            phone: string;
        }>('/auth/me');
        return {
            user_id: response.data.user_id,
            email: response.data.email,
            name: response.data.full_name,
            phone: response.data.phone,
        };
    },
    
    // Function to handle forgot password
    async forgotPassword(data: ForgotPasswordData): Promise<MessageResponse> {
        const response = await api.post<MessageResponse>('/auth/forgot-password', data);
        return response.data;
    },

    // Function to handle reset password
    async resetPassword(data: ResetPasswordData): Promise<MessageResponse> {
        const response = await api.post<MessageResponse>('/auth/reset-password', data);
        return response.data;
    }

}

