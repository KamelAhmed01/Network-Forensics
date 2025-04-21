import express from 'express';
import { Tail } from 'tail';
import cors from 'cors';
import fs from 'fs';
import readline from 'readline';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// In-memory cache for logs
let logsCache = [];
const MAX_CACHE_SIZE = 1000;

// Function to parse and filter Suricata logs
const parseLog = (line) => {
  try {
    const log = JSON.parse(line);
    
    // Process all event types, not just HTTP
    // This ensures we capture all Suricata data
    const defaultSeverity = log.alert?.severity >= 3 ? 'high' : 
                           log.alert?.severity === 2 ? 'medium' : 'low';
    
    return {
      id: `${log.timestamp || new Date().toISOString()}-${log.flow_id || Math.random().toString(36).substring(2, 15)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      sourceIp: log.src_ip || log.src || '0.0.0.0',
      destinationIp: log.dest_ip || log.dst || '0.0.0.0',
      sourcePort: log.src_port || 0,
      destinationPort: log.dest_port || 0,
      protocol: log.proto || log.app_proto || 'UNKNOWN',
      method: log.http?.http_method || (log.event_type === 'http' ? 'GET' : undefined),
      url: log.http?.url || log.http?.uri || '',
      statusCode: log.http?.status || log.http?.status_code,
      severity: defaultSeverity,
      category: log.alert?.category || log.event_type || 'info',
      message: log.alert?.signature || `${log.event_type} Traffic`,
      headers: {
        'User-Agent': log.http?.http_user_agent,
        'Content-Type': log.http?.http_content_type,
        'Host': log.http?.hostname
      },
      payload: log.http?.http_payload,
      raw: log,
      event_type: log.event_type || 'unknown'
    };
  } catch (error) {
    console.error('Error parsing log:', error);
    return null;
  }
};

// Socket.io instance will be initialized after creating the HTTP server

// Endpoint to get recent logs with filtering
app.get('/logs', (req, res) => {
  const { 
    page = 1, 
    limit = 50,
    severity,
    protocol,
    startDate,
    endDate,
    search
  } = req.query;

  let filteredLogs = [...logsCache];

  // Apply filters
  if (severity) {
    const severities = severity.split(',');
    filteredLogs = filteredLogs.filter(log => severities.includes(log.severity));
  }

  if (protocol) {
    const protocols = protocol.split(',');
    filteredLogs = filteredLogs.filter(log => protocols.includes(log.protocol));
  }

  if (startDate && endDate) {
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredLogs = filteredLogs.filter(log =>
      log.sourceIp.includes(searchLower) ||
      log.destinationIp.includes(searchLower) ||
      log.message.toLowerCase().includes(searchLower) ||
      (log.url && log.url.toLowerCase().includes(searchLower))
    );
  }

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  res.json({
    logs: paginatedLogs,
    total: filteredLogs.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// Endpoint to get dashboard statistics
app.get('/stats', (req, res) => {
  const stats = {
    totalLogs: logsCache.length,
    severityStats: [
      { name: 'low', value: 0, color: '#38A169' },
      { name: 'medium', value: 0, color: '#ECC94B' },
      { name: 'high', value: 0, color: '#DD6B20' },
      { name: 'critical', value: 0, color: '#E53E3E' }
    ],
    protocolStats: [],
    statusCodeStats: [],
    timeSeriesStats: []
  };

  // Calculate stats from logs
  logsCache.forEach(log => {
    // Severity stats
    const severityStat = stats.severityStats.find(s => s.name === log.severity);
    if (severityStat) severityStat.value++;

    // Protocol stats
    const protocolStat = stats.protocolStats.find(p => p.name === log.protocol);
    if (protocolStat) {
      protocolStat.value++;
    } else {
      stats.protocolStats.push({ name: log.protocol, value: 1 });
    }

    // Status code stats
    if (log.statusCode) {
      const statusStat = stats.statusCodeStats.find(s => s.code === log.statusCode);
      if (statusStat) {
        statusStat.count++;
      } else {
        stats.statusCodeStats.push({ code: log.statusCode, count: 1 });
      }
    }
  });

  // Generate time series data (last 24 hours)
  const now = new Date();
  const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

  for (let i = 0; i < 24; i++) {
    const hourStart = new Date(now - (23 - i) * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const count = logsCache.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= hourStart && logTime < hourEnd;
    }).length;

    stats.timeSeriesStats.push({
      timestamp: hourStart.toISOString(),
      count
    });
  }

  res.json(stats);
});

// Start tailing the Suricata log file
const initLogTail = () => {
  const logPath = '/var/log/suricata/eve.json';

  // Check if the Suricata log file exists
  if (!fs.existsSync(logPath)) {
    console.error(`Error: Suricata log file not found at ${logPath}`);
    console.error('Please make sure Suricata is installed and configured properly.');
    console.error('The application requires Suricata to be running with logs at /var/log/suricata/eve.json');
    process.exit(1); // Exit the application since real data is required
  }

  console.log(`Using Suricata log file at: ${logPath}`);

  // First, read existing logs
  const readStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    const parsedLog = parseLog(line);
    if (parsedLog) {
      logsCache.unshift(parsedLog);
      if (logsCache.length > MAX_CACHE_SIZE) {
        logsCache.pop();
      }
    }
  });

  // Then start tailing for new logs
  const tail = new Tail(logPath);

  tail.on('line', (data) => {
    const parsedLog = parseLog(data);
    if (parsedLog) {
      logsCache.unshift(parsedLog);
      if (logsCache.length > MAX_CACHE_SIZE) {
        logsCache.pop();
      }

      // Broadcast to Socket.io clients
      io.emit('new-log', parsedLog);
    }
  });

  tail.on('error', (error) => {
    console.error('Error tailing log file:', error);
  });
};

// Start the server
const server = app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});

// Initialize Socket.io with stable configuration
const io = new SocketIOServer(server, {
  cors: {
    // Allow connections from all frontend URLs
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  // Transport configuration
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  // More stable ping settings
  pingInterval: 10000,  // Send a ping every 10 seconds
  pingTimeout: 60000,   // Consider the connection dead if no pong in 60 seconds
  connectTimeout: 45000  // Longer connect timeout
});

io.on('connection', (socket) => {
  console.log('Client connected to Socket.io', socket.id);
  
  // Send initial logs to connected client
  if (logsCache.length > 0) {
    console.log(`Sending ${Math.min(50, logsCache.length)} initial logs to new client`);
    socket.emit('initial-logs', logsCache.slice(0, 50));
  }
  
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected from Socket.io: ${socket.id}, reason: ${reason}`);
  });
});

io.engine.on('connection_error', (err) => {
  console.log('Socket.io connection error:', err);
});

// Initialize log tailing after Socket.io is set up
initLogTail();