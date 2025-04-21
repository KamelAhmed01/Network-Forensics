import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuOptionGroup,
  MenuItemOption,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { Search, Filter, X, ChevronDown, Clock, Trash2 } from 'lucide-react';
import { FilterOptions } from '../../types';

interface FilterPanelProps {
  filters: FilterOptions;
  onUpdateFilters: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  isLoading = false,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFilters({ ...filters, search: searchInput });
  };

  const handleSeverityChange = useCallback(
    (values: string[]) => {
      onUpdateFilters({
        ...filters,
        severity: values.length > 0 ? values : undefined,
      });
    },
    [filters, onUpdateFilters]
  );

  const handleProtocolChange = useCallback(
    (values: string[]) => {
      onUpdateFilters({
        ...filters,
        protocol: values.length > 0 ? values : undefined,
      });
    },
    [filters, onUpdateFilters]
  );

  const handleRemoveFilter = useCallback(
    (key: keyof FilterOptions) => {
      const newFilters = { ...filters };
      delete newFilters[key];
      onUpdateFilters(newFilters);
    },
    [filters, onUpdateFilters]
  );

  const handleSetTimeRange = useCallback(
    (range: 'hour' | 'day' | 'week' | 'month') => {
      const now = new Date();
      const startDate = new Date();
      
      switch (range) {
        case 'hour':
          startDate.setHours(now.getHours() - 1);
          break;
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      onUpdateFilters({
        ...filters,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      });
    },
    [filters, onUpdateFilters]
  );

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(
    (key) => key !== 'search' && filters[key as keyof FilterOptions] !== undefined
  ).length;

  return (
    <Box 
      bg={bgColor} 
      p={4} 
      borderRadius="md" 
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
      mb={4}
    >
      <form onSubmit={handleSearchSubmit}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
          <InputGroup flex="1">
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search logs by IP, message, URL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              borderRadius="md"
            />
          </InputGroup>
          
          <HStack spacing={2}>
            <Button
              leftIcon={<Filter size={16} />}
              variant={isAdvancedFilterOpen ? "solid" : "outline"}
              colorScheme={isAdvancedFilterOpen ? "blue" : "gray"}
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              position="relative"
            >
              Filters
              {activeFilterCount > 0 && (
                <Box
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  w="18px"
                  h="18px"
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {activeFilterCount}
                </Box>
              )}
            </Button>
            
            <Menu closeOnSelect={false}>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDown size={16} />}
                variant="outline"
                colorScheme="gray"
              >
                Time
              </MenuButton>
              <MenuList minWidth="240px">
                <MenuOptionGroup title="Time Range" type="radio">
                  <MenuItem 
                    icon={<Clock size={16} />} 
                    onClick={() => handleSetTimeRange('hour')}
                  >
                    Last Hour
                  </MenuItem>
                  <MenuItem 
                    icon={<Clock size={16} />} 
                    onClick={() => handleSetTimeRange('day')}
                  >
                    Last 24 Hours
                  </MenuItem>
                  <MenuItem 
                    icon={<Clock size={16} />} 
                    onClick={() => handleSetTimeRange('week')}
                  >
                    Last 7 Days
                  </MenuItem>
                  <MenuItem 
                    icon={<Clock size={16} />} 
                    onClick={() => handleSetTimeRange('month')}
                  >
                    Last 30 Days
                  </MenuItem>
                </MenuOptionGroup>
                <MenuDivider />
                <MenuItem 
                  icon={<Trash2 size={16} />}
                  onClick={() => {
                    handleRemoveFilter('startDate');
                    handleRemoveFilter('endDate');
                  }}
                >
                  Clear Time Filter
                </MenuItem>
              </MenuList>
            </Menu>
            
            {Object.keys(filters).length > 0 && (
              <IconButton
                aria-label="Clear all filters"
                icon={<X size={16} />}
                variant="ghost"
                colorScheme="red"
                onClick={onResetFilters}
                isLoading={isLoading}
              />
            )}
          </HStack>
        </Flex>
      </form>

      <Collapse in={isAdvancedFilterOpen} animateOpacity>
        <Box pt={4}>
          <Flex wrap="wrap" gap={2} mb={4}>
            <Menu closeOnSelect={false}>
              <MenuButton as={Button} variant="outline" size="sm">
                Severity
              </MenuButton>
              <MenuList minWidth="240px">
                <MenuOptionGroup 
                  title="Severity Levels" 
                  type="checkbox"
                  value={filters.severity || []}
                  onChange={(values) => handleSeverityChange(values as string[])}
                >
                  <MenuItemOption value="low">Low</MenuItemOption>
                  <MenuItemOption value="medium">Medium</MenuItemOption>
                  <MenuItemOption value="high">High</MenuItemOption>
                  <MenuItemOption value="critical">Critical</MenuItemOption>
                </MenuOptionGroup>
              </MenuList>
            </Menu>

            <Menu closeOnSelect={false}>
              <MenuButton as={Button} variant="outline" size="sm">
                Protocol
              </MenuButton>
              <MenuList minWidth="240px">
                <MenuOptionGroup 
                  title="Protocol" 
                  type="checkbox"
                  value={filters.protocol || []}
                  onChange={(values) => handleProtocolChange(values as string[])}
                >
                  <MenuItemOption value="HTTP">HTTP</MenuItemOption>
                  <MenuItemOption value="HTTPS">HTTPS</MenuItemOption>
                  <MenuItemOption value="TCP">TCP</MenuItemOption>
                  <MenuItemOption value="UDP">UDP</MenuItemOption>
                  <MenuItemOption value="ICMP">ICMP</MenuItemOption>
                </MenuOptionGroup>
              </MenuList>
            </Menu>
          </Flex>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <Flex wrap="wrap" gap={2}>
              {filters.severity && (
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="purple">
                  <TagLabel>Severity: {filters.severity.join(', ')}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveFilter('severity')} />
                </Tag>
              )}
              
              {filters.protocol && (
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                  <TagLabel>Protocol: {filters.protocol.join(', ')}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveFilter('protocol')} />
                </Tag>
              )}
              
              {filters.startDate && filters.endDate && (
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="green">
                  <TagLabel>Time Range</TagLabel>
                  <TagCloseButton 
                    onClick={() => {
                      handleRemoveFilter('startDate');
                      handleRemoveFilter('endDate');
                    }} 
                  />
                </Tag>
              )}
              
              {filters.sourceIp && (
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="orange">
                  <TagLabel>Source IP: {filters.sourceIp}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveFilter('sourceIp')} />
                </Tag>
              )}
              
              {filters.destinationIp && (
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="cyan">
                  <TagLabel>Destination IP: {filters.destinationIp}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveFilter('destinationIp')} />
                </Tag>
              )}
            </Flex>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel;