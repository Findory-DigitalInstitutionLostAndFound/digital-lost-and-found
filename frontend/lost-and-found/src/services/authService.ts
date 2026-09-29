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
    }

}

