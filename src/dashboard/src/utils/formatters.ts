import { format, formatDistance } from 'date-fns';

// Format a timestamp to a readable date string
export const formatTimestamp = (timestamp: string, includeMilliseconds = false): string => {
  const dateFormat = includeMilliseconds ? 'yyyy-MM-dd HH:mm:ss.SSS' : 'yyyy-MM-dd HH:mm:ss';
  return format(new Date(timestamp), dateFormat);
};

// Format a relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp: string): string => {
  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
};

// Format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Truncate a string with ellipsis
export const truncateString = (str: string, maxLength = 50): string => {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

// Format IP address for display
export const formatIpAddress = (ip: string): string => {
  return ip || 'Unknown';
};

// Get color for severity level
export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'red.500';
    case 'high':
      return 'orange.500';
    case 'medium':
      return 'yellow.500';
    case 'low':
      return 'green.500';
    default:
      return 'gray.500';
  }
};

// Format HTTP status code with color
export const formatStatusCode = (code: number): { text: string; color: string } => {
  if (!code) {
    return { text: 'N/A', color: 'gray.500' };
  }

  if (code >= 200 && code < 300) {
    return { text: code.toString(), color: 'green.500' };
  } else if (code >= 300 && code < 400) {
    return { text: code.toString(), color: 'blue.500' };
  } else if (code >= 400 && code < 500) {
    return { text: code.toString(), color: 'orange.500' };
  } else if (code >= 500) {
    return { text: code.toString(), color: 'red.500' };
  }

  return { text: code.toString(), color: 'gray.500' };
};