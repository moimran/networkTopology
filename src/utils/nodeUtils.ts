import { logger } from './logger';

/**
 * Generate a unique node ID for a new device node
 * @returns A unique string ID in the format 'node_[timestamp]_[random]'
 */
export const generateNodeId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const nodeId = `node_${timestamp}_${random}`;
  
  logger.debug('Generated new node ID', { nodeId });
  return nodeId;
};
