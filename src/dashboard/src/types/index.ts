export interface LogEntry {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  method?: string;
  url?: string;
  statusCode?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  headers?: Record<string, string>;
  payload?: string;
  raw: Record<string, any>;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterOptions {
  severity?: string[];
  protocol?: string[];
  statusCode?: number[];
  category?: string[];
  sourceIp?: string;
  destinationIp?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SeverityStat {
  name: string;
  value: number;
  color: string;
}

export interface TimeSeriesStat {
  timestamp: string;
  count: number;
}

export interface ProtocolStat {
  name: string;
  value: number;
}

export interface StatusCodeStat {
  code: number;
  count: number;
}

export interface DashboardStats {
  totalLogs: number;
  severityStats: SeverityStat[];
  protocolStats: ProtocolStat[];
  statusCodeStats: StatusCodeStat[];
  timeSeriesStats: TimeSeriesStat[];
}