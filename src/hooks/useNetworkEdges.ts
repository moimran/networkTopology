import { useCallback } from 'react';
import { Connection, Edge, useEdgesState, addEdge } from '@xyflow/react';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing network edges
 */
export const useNetworkEdges = () => {
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  /**
   * Handle new connections between nodes
   */
  const onConnect = useCallback((connection: Connection) => {
    logger.debug('Creating new connection', connection);
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  return {
    edges,
    setEdges,
    onEdgesChange,
    onConnect,
  };
};
