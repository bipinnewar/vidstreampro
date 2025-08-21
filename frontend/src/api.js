import axios from 'axios';

/*
 * Central API client used throughout the frontend. It automatically
 * prepends the base URL and attaches the JWT token from localStorage
 * to the Authorization header. If no REACT_APP_API_BASE is provided
 * the client assumes relative URLs (useful for Azure Static Web Apps
 * when the backend is configured as an API). Set REACT_APP_API_BASE
 * in your environment (e.g. .env file) if running locally.
 */
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || '',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});