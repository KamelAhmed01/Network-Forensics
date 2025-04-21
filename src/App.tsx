import React, { useState, useCallback } from 'react';
import { ChakraProvider, Box, Flex, Container, extendTheme, ColorModeScript } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LogsTable from './components/dashboard/LogsTable';
import FilterPanel from './components/dashboard/FilterPanel';
import StatsPanel from './components/dashboard/StatsPanel';
import DetailModal from './components/dashboard/DetailModal';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { useLogsFetching } from './hooks/useLogsFetching';
import { useWebSocket } from './hooks/useWebSocket';
import { LogEntry } from './types';
import Header from './components/layout/Header';

// Create a theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e0f0ff',
      100: '#b1dbff',
      200: '#81c6ff',
      300: '#51b0ff',
      400: '#219bff',
      500: '#0080e6',
      600: '#0064b4',
      700: '#004782',
      800: '#002b51',
      900: '#001021',
    },
  },
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Inner component that uses React Query hooks
function LogsDashboard() {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    logs,
    addLog,
    filters,
    updateFilters,
    resetFilters,
    isLogsLoading,
    logsError,
    stats,
    isStatsLoading,
    statsError,
  } = useLogsFetching();

  // Set up WebSocket connection
  const { isConnected: isWebSocketConnected } = useWebSocket({
    onNewLog: (log) => {
      addLog(log);
    },
  });

  const handleViewDetails = useCallback((log: LogEntry) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  return (
    <ErrorBoundary>
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <Header 
          isWebSocketConnected={isWebSocketConnected} 
          totalLogs={stats?.totalLogs || 0}
        />
        
        <Container maxW="container.xl" py={6}>
          <FilterPanel
            filters={filters}
            onUpdateFilters={updateFilters}
            onResetFilters={resetFilters}
            isLoading={isLogsLoading}
          />

          <ErrorBoundary>
            {isStatsLoading && !stats ? (
              <LoadingSpinner message="Loading statistics..." />
            ) : statsError ? (
              <Box p={4} bg="red.50" color="red.800" borderRadius="md" mb={4}>
                Error loading statistics: {statsError.message}
              </Box>
            ) : (
              <StatsPanel stats={stats} isLoading={isStatsLoading} />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            {isLogsLoading && logs.length === 0 ? (
              <LoadingSpinner message="Loading logs..." />
            ) : logsError ? (
              <Box p={4} bg="red.50" color="red.800" borderRadius="md">
                Error loading logs: {logsError.message}
              </Box>
            ) : (
              <LogsTable
                logs={logs}
                isLoading={isLogsLoading}
                onViewDetails={handleViewDetails}
              />
            )}
          </ErrorBoundary>
        </Container>
      </Box>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        log={selectedLog}
      />
    </ErrorBoundary>
  );
}

// Main App component that provides the React Query context
function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <QueryClientProvider client={queryClient}>
        <LogsDashboard />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;