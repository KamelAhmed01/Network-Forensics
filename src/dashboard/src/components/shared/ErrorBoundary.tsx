import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={8} maxW="800px" mx="auto" textAlign="center">
          <VStack spacing={4} align="center">
            <AlertTriangle size={48} color="#E53E3E" />
            <Heading as="h2" size="xl">Something went wrong</Heading>
            <Text color="gray.600">
              An unexpected error occurred. Our team has been notified.
            </Text>
            {this.state.error && (
              <Box 
                p={4} 
                bg="red.50" 
                color="red.800" 
                borderRadius="md" 
                fontSize="sm" 
                width="100%" 
                textAlign="left"
                overflow="auto"
              >
                <Text fontWeight="bold">Error:</Text>
                <Text>{this.state.error.toString()}</Text>
              </Box>
            )}
            <Button 
              colorScheme="blue" 
              onClick={this.resetError}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;