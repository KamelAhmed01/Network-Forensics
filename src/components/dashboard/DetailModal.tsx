import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Badge,
  Divider,
  Flex,
  Grid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { LogEntry } from '../../types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const panelBg = useColorModeValue('gray.50', 'gray.700');

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <Flex align="center">
            <Text>Log Details</Text>
            <Badge
              ml={2}
              colorScheme={getSeverityColor(log.severity)}
              fontSize="0.8em"
              variant="solid"
            >
              {log.severity}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box mb={4}>
            <Text fontWeight="bold" fontSize="lg">{log.message}</Text>
            <Text fontSize="sm" color="gray.500">
              {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}
            </Text>
          </Box>

          <Divider mb={4} />

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={4}>
            <Box>
              <Text fontWeight="semibold" mb={1}>Source</Text>
              <Flex 
                bg={panelBg} 
                p={2} 
                borderRadius="md" 
                border="1px" 
                borderColor={borderColor}
                direction="column"
              >
                <Text>{log.sourceIp}</Text>
                <Text fontSize="sm" color="gray.500">Port: {log.sourcePort}</Text>
              </Flex>
            </Box>
            
            <Box>
              <Text fontWeight="semibold" mb={1}>Destination</Text>
              <Flex 
                bg={panelBg} 
                p={2} 
                borderRadius="md" 
                border="1px" 
                borderColor={borderColor}
                direction="column"
              >
                <Text>{log.destinationIp}</Text>
                <Text fontSize="sm" color="gray.500">Port: {log.destinationPort}</Text>
              </Flex>
            </Box>
          </Grid>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={4}>
            <Box>
              <Text fontWeight="semibold" mb={1}>Protocol</Text>
              <Badge>{log.protocol}</Badge>
            </Box>
            
            {log.method && (
              <Box>
                <Text fontWeight="semibold" mb={1}>Method</Text>
                <Badge colorScheme="purple">{log.method}</Badge>
              </Box>
            )}
            
            {log.statusCode && (
              <Box>
                <Text fontWeight="semibold" mb={1}>Status Code</Text>
                <Badge 
                  colorScheme={
                    log.statusCode >= 200 && log.statusCode < 300 ? 'green' :
                    log.statusCode >= 300 && log.statusCode < 400 ? 'blue' :
                    log.statusCode >= 400 && log.statusCode < 500 ? 'orange' : 'red'
                  }
                >
                  {log.statusCode}
                </Badge>
              </Box>
            )}
          </Grid>

          {log.url && (
            <Box mb={4}>
              <Text fontWeight="semibold" mb={1}>URL</Text>
              <Text 
                bg={panelBg}
                p={2}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
                fontSize="sm"
                fontFamily="monospace"
                overflowX="auto"
              >
                {log.url}
              </Text>
            </Box>
          )}

          <Accordion allowToggle mb={4}>
            <AccordionItem border="1px" borderColor={borderColor} borderRadius="md">
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  HTTP Headers
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} bg={panelBg}>
                {log.headers ? (
                  <Box
                    fontFamily="monospace"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    overflowX="auto"
                  >
                    {Object.entries(log.headers).map(([key, value]) => (
                      <Box key={key} mb={1}>
                        <Text as="span" fontWeight="bold">{key}:</Text>{' '}
                        <Text as="span">{value}</Text>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Text color="gray.500">No header information available</Text>
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle mb={4}>
            <AccordionItem border="1px" borderColor={borderColor} borderRadius="md">
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Payload
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} bg={panelBg}>
                {log.payload ? (
                  <Box
                    fontFamily="monospace"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    overflowX="auto"
                  >
                    {log.payload}
                  </Box>
                ) : (
                  <Text color="gray.500">No payload information available</Text>
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle>
            <AccordionItem border="1px" borderColor={borderColor} borderRadius="md">
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Raw Log Data
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} bg={panelBg}>
                <Box
                  fontFamily="monospace"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  overflowX="auto"
                >
                  {JSON.stringify(log.raw, null, 2)}
                </Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DetailModal;