import axios from 'axios';
import { LogEntry, LogsResponse, FilterOptions, DashboardStats } from '../types';

// With the proxy setup in vite.config.ts, we can use relative URLs
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Important for CORS with credentials
  withCredentials: true,
  // Add timeout to avoid hanging requests
  timeout: 10000,
});

export const fetchLogs = async (
  page = 1,
  limit = 50,
  filters: FilterOptions = {}
): Promise<LogsResponse> => {
  try {
    const response = await api.get('/logs', {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};

export const fetchLogDetails = async (id: string): Promise<LogEntry> => {
  try {
    const response = await api.get(`/logs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching log details:', error);
    throw error;
  }
};

export const fetchDashboardStats = async (
  filters: FilterOptions = {}
): Promise<DashboardStats> => {
  try {
    const response = await api.get('/stats', {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default api;