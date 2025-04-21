import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { LogEntry } from '../../types';
import { Eye, AlertCircle } from 'lucide-react';
import { AutoSizer, List, ListRowProps, CellMeasurer, CellMeasurerCache } from 'react-virtualized';

interface LogsTableProps {
  logs: LogEntry[];
  isLoading: boolean;
  onViewDetails: (log: LogEntry) => void;
}

const LogsTable: React.FC<LogsTableProps> = ({ logs, isLoading, onViewDetails }) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const listRef = useRef<List>(null);

  // Cache for dynamic row heights
  const cache = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 80,
    })
  );

  // Background colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Reset cache when logs change
  useEffect(() => {
    if (logs.length > 0) {
      cache.current.clearAll();
      listRef.current?.recomputeRowHeights();
    }
  }, [logs]);

  // Severity badge colors
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Protocol badge colors
  const getProtocolColor = (protocol: string): string => {
    switch (protocol) {
      case 'HTTP':
        return 'blue';
      case 'HTTPS':
        return 'teal';
      case 'TCP':
        return 'purple';
      case 'UDP':
        return 'cyan';
      case 'ICMP':
        return 'pink';
      default:
        return 'gray';
    }
  };

  // HTTP status badge colors
  const getStatusCodeColor = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return 'green';
    if (statusCode >= 300 && statusCode < 400) return 'blue';
    if (statusCode >= 400 && statusCode < 500) return 'orange';
    if (statusCode >= 500) return 'red';
    return 'gray';
  };

  const renderRow = ({ index, key, style, parent }: ListRowProps) => {
    const log = logs[index];
    const isHovered = hoveredRow === log.id;

    return (
      <CellMeasurer
        key={key}
        cache={cache.current}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild }) => (
          <Box
            ref={registerChild as any}
            style={style}
            bg={isHovered ? hoverBg : bg}
            borderBottom="1px solid"
            borderBottomColor={borderColor}
            p={3}
            onMouseEnter={() => setHoveredRow(log.id)}
            onMouseLeave={() => setHoveredRow(null)}
            transition="background-color 0.2s ease"
            className={`log-row ${log.severity}`}
            data-testid={`log-row-${index}`}
          >
            <Flex justify="space-between" align="flex-start">
              <Box flex="1">
                <Flex align="center" mb={2}>
                  <Text fontSize="sm" color="gray.500" mr={2}>
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </Text>
                  
                  <Badge
                    colorScheme={getSeverityColor(log.severity)}
                    variant="subtle"
                    mr={2}
                  >
                    {log.severity}
                  </Badge>
                  
                  <Badge
                    colorScheme={getProtocolColor(log.protocol)}
                    variant="outline"
                    mr={2}
                  >
                    {log.protocol}
                  </Badge>
                  
                  {log.statusCode && (
                    <Badge
                      colorScheme={getStatusCodeColor(log.statusCode)}
                      variant="solid"
                      mr={2}
                    >
                      {log.statusCode}
                    </Badge>
                  )}
                  
                  {log.method && (
                    <Badge variant="subtle" mr={2}>
                      {log.method}
                    </Badge>
                  )}
                </Flex>
                
                <Text fontWeight="medium" mb={1} noOfLines={2}>
                  {log.message}
                </Text>
                
                <Flex color="gray.600" fontSize="sm">
                  <Text mr={4}>
                    <Text as="span" fontWeight="semibold">From:</Text> {log.sourceIp}:{log.sourcePort}
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="semibold">To:</Text> {log.destinationIp}:{log.destinationPort}
                  </Text>
                </Flex>
                
                {log.url && (
                  <Text fontSize="sm" color="blue.500" noOfLines={1} mt={1}>
                    {log.url}
                  </Text>
                )}
              </Box>
              
              <Box>
                <Tooltip label="View Details" placement="left">
                  <IconButton
                    aria-label="View details"
                    icon={<Eye size={18} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails(log)}
                  />
                </Tooltip>
                
                {log.severity === 'critical' && (
                  <Tooltip label="Critical Alert" placement="left">
                    <IconButton
                      aria-label="Critical alert"
                      icon={<AlertCircle size={18} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      ml={1}
                    />
                  </Tooltip>
                )}
              </Box>
            </Flex>
          </Box>
        )}
      </CellMeasurer>
    );
  };

  return (
    <Box 
      borderRadius="md" 
      border="1px solid" 
      borderColor={borderColor}
      bg={bg}
      height="calc(100vh - 280px)" // Adjust based on your layout
      minHeight="400px"
      overflow="hidden"
      boxShadow="sm"
    >
      <Flex 
        bg={headerBg}
        p={3}
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        fontWeight="semibold"
      >
        <Text>HTTP Traffic Logs</Text>
        {isLoading && (
          <Text fontSize="sm" ml={2} color="gray.500">
            (refreshing...)
          </Text>
        )}
      </Flex>
      
      <Box height="calc(100% - 48px)">
        {logs.length === 0 ? (
          <Flex 
            justify="center" 
            align="center" 
            height="100%" 
            color="gray.500"
            flexDirection="column"
            p={8}
          >
            <Text fontSize="lg" mb={2}>No logs found</Text>
            <Text fontSize="sm">Try adjusting your filters or check your connection</Text>
          </Flex>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                deferredMeasurementCache={cache.current}
                height={height}
                width={width}
                rowCount={logs.length}
                rowHeight={cache.current.rowHeight}
                rowRenderer={renderRow}
                overscanRowCount={5}
              />
            )}
          </AutoSizer>
        )}
      </Box>
    </Box>
  );
};

export default LogsTable;