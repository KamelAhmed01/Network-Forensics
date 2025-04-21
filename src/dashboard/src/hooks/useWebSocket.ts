import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { LogEntry } from '../types';

// Extended Error interface for Socket.io errors
interface SocketError extends Error {
  type?: string;
  description?: any;
}

interface UseWebSocketOptions {
  onNewLog?: (log: LogEntry) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

// Direct WebSocket URL to the backend server
const getWebSocketUrl = () => {
  // With the proxy configuration, we can use the same origin
  return window.location.origin;
};

export const useWebSocket = ({
  onNewLog,
  onConnect,
  onDisconnect,
  onError,
  autoConnect = true,
}: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      const wsUrl = getWebSocketUrl();
      console.log('Attempting to connect to WebSocket at:', wsUrl);
      
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      socketRef.current = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Important for CORS
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        // Only update connection status for certain disconnect reasons to avoid UI flicker
        // Don't mark as disconnected for transport errors that will automatically reconnect
        if (['io client disconnect', 'io server disconnect'].includes(reason)) {
          setIsConnected(false);
          onDisconnect?.();
        }

        // Let socket.io's built-in reconnection handle most cases
        // Only implement our custom reconnection for certain scenarios
        if (['io server disconnect'].includes(reason)) {
          if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttemptsRef.current})...`);
              connect();
            }, delay);
          } else {
            console.log('Maximum reconnection attempts reached, giving up.');
            setError(new Error('Failed to connect to WebSocket server after multiple attempts'));
            onError?.(new Error('Failed to connect to WebSocket server after multiple attempts'));
          }
        }
      });

      socketRef.current.on('connect_error', (err: SocketError) => {
        console.error('WebSocket connection error:', err);
        console.error('Error details:', {
          message: err.message,
          type: err.type,
          description: err.description,
          stack: err.stack
        });
        setError(err);
        onError?.(err);
      });

      // Add specific handler for timeout errors
      socketRef.current.io.on('error', (err: Error) => {
        console.error('Transport error:', err);
        if (err.message === 'timeout') {
          console.error('Connection timed out. The WebSocket server might not be running or accessible.');
          setError(new Error('WebSocket connection timed out. Please ensure the server is running.'));
          onError?.(new Error('WebSocket connection timed out. Please ensure the server is running.'));
        }
      });

      // Handle individual new logs
      socketRef.current.on('new-log', (data: LogEntry) => {
        console.log('New log received:', data);
        onNewLog?.(data);
      });
      
      // Handle batch of initial logs
      socketRef.current.on('initial-logs', (data: LogEntry[]) => {
        console.log(`Received ${data.length} initial logs`);
        data.forEach(log => {
          onNewLog?.(log);
        });
      });
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError(err instanceof Error ? err : new Error('Unknown WebSocket error'));
      onError?.(err instanceof Error ? err : new Error('Unknown WebSocket error'));
    }
  }, [onConnect, onDisconnect, onError, onNewLog]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
};