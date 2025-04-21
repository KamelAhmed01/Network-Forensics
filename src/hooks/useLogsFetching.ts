import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLogs, fetchDashboardStats } from '../services/api';
import { LogEntry, FilterOptions, DashboardStats } from '../types';

const REFRESH_INTERVAL = Number(import.meta.env.VITE_LOGS_REFRESH_INTERVAL) || 10000;

export const useLogsFetching = (initialFilters: FilterOptions = {}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Fetch logs with pagination and filters
  const {
    data: logsData,
    isLoading: isLogsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['logs', page, limit, filters],
    queryFn: async () => {
      return fetchLogs(page, limit, filters);
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL / 2,
  });

  // Fetch dashboard stats
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['stats', filters],
    queryFn: async () => {
      return fetchDashboardStats(filters);
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL / 2,
  });

  // Update logs state when data changes
  useEffect(() => {
    if (logsData?.logs) {
      setLogs(logsData.logs);
    }
  }, [logsData]);

  // Add a new log to the top of the list
  const addLog = useCallback((newLog: LogEntry) => {
    setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, limit - 1)]);
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }, [limit, queryClient]);

  // Handle filtering
  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    logs,
    addLog,
    totalLogs: logsData?.total || 0,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    updateFilters,
    resetFilters,
    isLogsLoading,
    logsError,
    refetchLogs,
    stats: statsData,
    isStatsLoading,
    statsError,
    refetchStats,
  };
};