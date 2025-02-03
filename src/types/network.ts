import { Position } from '@xyflow/react';

/**
 * Configuration for a node handle
 */
export interface HandleData {
  type: 'source';
  position: Position;
}

/**
 * Data structure for network nodes
 */
export interface NetworkNodeData {
  label?: string;
  handles: Record<string, HandleData>;
}

/**
 * Configuration for node initialization
 */
export interface NodeConfig {
  label: string;
  handles: Record<string, HandleData>;
}
