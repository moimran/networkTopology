import { logger } from './logger';

/**
 * Node ID generation strategy
 * Provides multiple methods for generating unique node IDs
 */
export class NodeIdGenerator {
  // Static counter for sequential ID generation
  private static counter = 0;

  /**
   * Generate a unique node ID using timestamp and random number
   * @returns A unique string ID in the format 'node_[timestamp]_[random]'
   */
  static generateTimestampId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const nodeId = `node_${timestamp}_${random}`;
    
    logger.debug('Generated timestamp-based node ID', { nodeId });
    return nodeId;
  }

  /**
   * Generate a unique node ID using an incrementing counter
   * @returns A unique string ID in the format 'node_[counter]'
   */
  static generateSequentialId(): string {
    this.counter += 1;
    const nodeId = `node_${this.counter}`;
    
    logger.debug('Generated sequential node ID', { nodeId });
    return nodeId;
  }

  /**
   * Generate a unique node ID with flexible strategy
   * @param strategy - The ID generation strategy to use
   * @returns A unique string node ID
   */
  static generateNodeId(strategy: 'timestamp' | 'sequential' = 'timestamp'): string {
    switch (strategy) {
      case 'timestamp':
        return this.generateTimestampId();
      case 'sequential':
        return this.generateSequentialId();
      default:
        logger.warn('Invalid node ID generation strategy, falling back to timestamp', { strategy });
        return this.generateTimestampId();
    }
  }
}

// Convenience function for direct import compatibility
export const generateNodeId = () => NodeIdGenerator.generateNodeId();
