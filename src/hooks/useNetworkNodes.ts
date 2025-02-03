import { useCallback } from 'react';
import { Node, NodeChange, XYPosition, applyNodeChanges } from '@xyflow/react';
import { generateNodeId } from '../config/nodeConfig';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing network nodes
 */
export const useNetworkNodes = () => {
  /**
   * Handle node changes (position, selection, etc.)
   */
  const onNodesChange = useCallback((changes: NodeChange[], nodes: Node[]) => {
    logger.debug('Node changes', { changes });
    return applyNodeChanges(changes, nodes);
  }, []);

  /**
   * Create a new basic network node
   */
  const createNode = useCallback((position: XYPosition): Node => {
    const nodeId = generateNodeId();
    
    const newNode: Node = {
      id: nodeId,
      type: 'networkNode',
      position,
      data: {
        label: `Node ${nodeId}`,
        handles: {
          right: { type: 'source', position: 2 },
          bottom: { type: 'source', position: 3 },
        },
      },
      draggable: true, // Enable node dragging
      selectable: true, // Enable node selection
    };

    logger.debug('Created basic network node', newNode);
    return newNode;
  }, []);

  return {
    onNodesChange,
    createNode,
  };
};
