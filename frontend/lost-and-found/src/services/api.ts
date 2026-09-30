import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// create axios instance  with credentials true because we are using cookies for authentication
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Handle 401 Unauthorized error globally using axios interceptors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401) {
            // clear local storage and redirect to login page ******check this later******
            localStorage.clear();
        }
        return Promise.reject(error);
    }
);

