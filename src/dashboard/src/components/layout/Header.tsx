import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Badge,
  useColorMode,
  useColorModeValue,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
} from '@chakra-ui/react';
import { 
  Activity, 
  Moon, 
  Sun, 
  Bell, 
  Settings,
  UserCircle,
  ChevronDown,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface HeaderProps {
  isWebSocketConnected: boolean;
  totalLogs: number;
}

const Header: React.FC<HeaderProps> = ({ isWebSocketConnected, totalLogs }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  // State to stabilize connection status display
  const [stableConnectionStatus, setStableConnectionStatus] = useState(isWebSocketConnected);
  
  // Only update the disconnected status after a delay to prevent flickering
  useEffect(() => {
    if (isWebSocketConnected) {
      // Immediately show connected status
      setStableConnectionStatus(true);
    } else {
      // Delay showing disconnected status by 5 seconds
      const timer = setTimeout(() => {
        setStableConnectionStatus(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isWebSocketConnected]);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={10}
      bg={bg}
      boxShadow="sm"
      borderBottom="1px"
      borderBottomColor={borderColor}
    >
      <Flex
        w="full"
        h="16"
        px={{ base: 4, md: 6 }}
        align="center"
        justify="space-between"
      >
        {/* Logo and title */}
        <Flex align="center">
          <Activity size={24} color="#3182CE" />
          <Heading
            as="h1"
            size="md"
            ml={2}
            color={textColor}
            fontWeight="semibold"
          >
            Suricata Monitor
          </Heading>
          <Badge
            ml={2}
            colorScheme={stableConnectionStatus ? 'green' : 'red'}
            variant="subtle"
            display="flex"
            alignItems="center"
          >
            {stableConnectionStatus ? (
              <>
                <Wifi size={12} style={{ marginRight: '4px' }} />
                Live
              </>
            ) : (
              <>
                <WifiOff size={12} style={{ marginRight: '4px' }} />
                Disconnected
              </>
            )}
          </Badge>
        </Flex>

        {/* Right side controls */}
        <HStack spacing={2}>
          <Badge
            colorScheme="blue"
            variant="subtle"
            fontSize="sm"
            py={1}
            px={2}
            borderRadius="full"
          >
            {totalLogs.toLocaleString()} events
          </Badge>

          <Menu>
            <MenuButton as={Button} size="sm" variant="ghost" rightIcon={<ChevronDown size={16} />}>
              <Bell size={18} />
            </MenuButton>
            <MenuList>
              <Text px={3} py={2} fontSize="sm" fontWeight="semibold">Notifications</Text>
              <MenuDivider />
              <MenuItem fontSize="sm">
                <Box as="span" w="2" h="2" borderRadius="full" bg="red.500" mr={2} />
                4 Critical alerts detected
              </MenuItem>
              <MenuItem fontSize="sm">
                <Box as="span" w="2" h="2" borderRadius="full" bg="orange.500" mr={2} />
                12 High severity events
              </MenuItem>
              <MenuDivider />
              <MenuItem fontSize="sm">View all notifications</MenuItem>
            </MenuList>
          </Menu>

          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />

          <IconButton
            aria-label="Settings"
            icon={<Settings size={18} />}
            variant="ghost"
            size="sm"
          />

          <Menu>
            <MenuButton 
              as={Button} 
              variant="ghost" 
              size="sm" 
              rightIcon={<ChevronDown size={16} />}
            >
              <UserCircle size={20} />
            </MenuButton>
            <MenuList>
              <MenuItem fontSize="sm">Profile</MenuItem>
              <MenuItem fontSize="sm">Settings</MenuItem>
              <MenuDivider />
              <MenuItem fontSize="sm">Log out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;