import { useCallback } from 'react';
import { Node, useNodesState, XYPosition } from '@xyflow/react';
import { DEFAULT_NODE_CONFIG, generateNodeId } from '../config/nodeConfig';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing network nodes
 */
export const useNetworkNodes = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);

  /**
   * Create a new network node
   */
  const createNode = useCallback((position: XYPosition) => {
    const nodeId = generateNodeId();
    logger.debug('Creating new node', { nodeId, position });

    const newNode: Node = {
      id: nodeId,
      type: 'networkNode',
      position,
      data: {
        label: `${DEFAULT_NODE_CONFIG.label} ${nodeId}`,
        handles: DEFAULT_NODE_CONFIG.handles,
      },
    };

    setNodes((nds) => nds.concat(newNode));
    return newNode;
  }, [setNodes]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    createNode,
  };
};
