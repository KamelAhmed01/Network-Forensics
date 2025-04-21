import React from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { DashboardStats } from '../../types';

interface StatsPanelProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!stats && !isLoading) {
    return null;
  }

  // Format time series data for charts
  const timeSeriesData = stats?.timeSeriesStats.map((item) => ({
    ...item,
    formattedTime: format(new Date(item.timestamp), 'HH:mm'),
  }));

  return (
    <Box mb={6}>
      <Grid 
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
        mb={6}
      >
        <Stat
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Total Logs</StatLabel>
          <StatNumber>{stats?.totalLogs.toLocaleString() || '—'}</StatNumber>
          <StatHelpText>
            Last 24 hours
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Critical Alerts</StatLabel>
          <StatNumber>
            {stats?.severityStats.find(s => s.name === 'critical')?.value.toLocaleString() || '—'}
          </StatNumber>
          <StatHelpText>
            <Badge colorScheme="red">Requires attention</Badge>
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Most Common Protocol</StatLabel>
          <StatNumber>
            {stats?.protocolStats.sort((a, b) => b.value - a.value)[0]?.name || '—'}
          </StatNumber>
          <StatHelpText>
            {stats?.protocolStats.sort((a, b) => b.value - a.value)[0]?.value.toLocaleString() || '—'} requests
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Error Rate</StatLabel>
          <StatNumber>
            {stats ? `${((stats.statusCodeStats
              .filter(s => s.code >= 400)
              .reduce((acc, curr) => acc + curr.count, 0) / 
              stats.statusCodeStats.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(1)}%` : '—'}
          </StatNumber>
          <StatHelpText>
            HTTP 4xx/5xx responses
          </StatHelpText>
        </Stat>
      </Grid>

      <Grid 
        templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={6}
        mb={6}
      >
        {/* Time Series Chart */}
        <Box
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
          height="300px"
        >
          <Heading size="sm" mb={4}>Traffic Over Time</Heading>
          {timeSeriesData && timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    fontSize: '12px',
                  }} 
                  formatter={(value) => [`${value} logs`, 'Count']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3182CE" 
                  activeDot={{ r: 6 }} 
                  strokeWidth={2}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Flex justify="center" align="center" height="90%">
              <Text color="gray.500">No time series data available</Text>
            </Flex>
          )}
        </Box>

        {/* Severity Distribution */}
        <Box
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
          height="300px"
        >
          <Heading size="sm" mb={4}>Severity Distribution</Heading>
          {stats?.severityStats && stats.severityStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={stats.severityStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={800}
                >
                  {stats.severityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} logs`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Flex justify="center" align="center" height="90%">
              <Text color="gray.500">No severity data available</Text>
            </Flex>
          )}
        </Box>
      </Grid>

      <Grid 
        templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={6}
      >
        {/* Protocol Distribution */}
        <Box
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
          height="300px"
        >
          <Heading size="sm" mb={4}>Protocol Distribution</Heading>
          {stats?.protocolStats && stats.protocolStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={stats.protocolStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80} 
                  tick={{ fontSize: 12 }} 
                />
                <Tooltip 
                  formatter={(value) => [`${value} logs`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    fontSize: '12px',
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#4299E1" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Flex justify="center" align="center" height="90%">
              <Text color="gray.500">No protocol data available</Text>
            </Flex>
          )}
        </Box>

        {/* Status Code Distribution */}
        <Box
          bg={bgColor}
          p={4}
          borderRadius="md"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
          height="300px"
        >
          <Heading size="sm" mb={4}>HTTP Status Codes</Heading>
          {stats?.statusCodeStats && stats.statusCodeStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={stats.statusCodeStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis 
                  dataKey="code" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value} responses`, 'Count']}
                  labelFormatter={(label) => `Status ${label}`}
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    fontSize: '12px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#805AD5" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Flex justify="center" align="center" height="90%">
              <Text color="gray.500">No status code data available</Text>
            </Flex>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default StatsPanel;