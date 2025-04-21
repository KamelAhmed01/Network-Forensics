import axios from 'axios';
import { LogEntry, LogsResponse, FilterOptions, DashboardStats } from '../types';

// Update this to point to your Python backend
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

// Add a new function to fetch anomalies from your Python backend
export const fetchAnomalies = async (limit = 50): Promise<any> => {
  try {
    const response = await api.get('/anomalies', {
      params: { limit }
    });
    
    // Transform the anomaly data to match your LogEntry format
    const logs: LogEntry[] = response.data.anomalies.map((anomaly: any) => ({
      id: anomaly.flow_id || String(Math.random()),
      timestamp: anomaly.timestamp,
      sourceIp: anomaly.src_ip,
      destinationIp: anomaly.dst_ip,
      sourcePort: 0, // Add if available in your anomaly data
      destinationPort: 0, // Add if available
      protocol: anomaly.proto || "UNKNOWN",
      severity: anomaly.score < -0.5 ? 'critical' : 
               anomaly.score < -0.3 ? 'high' : 'medium',
      category: 'anomaly',
      message: `Network anomaly detected (score: ${anomaly.score.toFixed(3)})`,
      raw: anomaly
    }));
    
    return {
      logs,
      total: response.data.total,
      page: 1,
      limit
    };
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    throw error;
  }
};

export default api;