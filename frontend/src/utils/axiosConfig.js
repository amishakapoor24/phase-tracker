import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('pt_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch {
        localStorage.removeItem('pt_user');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('pt_user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    
    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }
    
    // Handle 400 - Bad Request
    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Invalid request.';
      toast.error(message);
    }
    
    // Handle 500 - Server Error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }
    
    // Handle network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
