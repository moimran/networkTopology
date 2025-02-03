import { Position } from '@xyflow/react';
import { NodeConfig } from '../types/network';

/**
 * Default configuration for new network nodes
 */
export const DEFAULT_NODE_CONFIG: NodeConfig = {
  label: 'Network Node',
  handles: {
    right: { type: 'source', position: Position.Right },
    bottom: { type: 'source', position: Position.Bottom },
  }
};

/**
 * Node counter for generating unique IDs
 */
let nodeCounter = 0;

/**
 * Generate a unique node ID
 */
export const generateNodeId = (): string => {
  return `network_node_${nodeCounter++}`;
};
