import { Edge, Node } from '@xyflow/react';
import { EdgeOffsets } from '../types/edge.types';
import { MAX_EDGE_SPACING, MIN_EDGE_SPACING, DEBUG_ENABLED } from './constants';

/**
 * Calculate offset for parallel edges considering the angle between nodes
 */
export function calculateParallelOffset(
  source: Node,
  target: Node,
  edgeId: string,
  edges: Edge[]
): EdgeOffsets {
  // Debug: Log input parameters
  if (!source || !target) {
    DEBUG_ENABLED && console.debug('Missing node data:', { source, target, edgeId });
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Find parallel edges (edges between the same nodes)
  const parallelEdges = edges.filter(
    (edge) => (
      (edge.source === source?.id && edge.target === target?.id) ||
      (edge.source === target?.id && edge.target === source?.id)
    )
  );

  // Debug: Log parallel edges found
  DEBUG_ENABLED && console.debug('Parallel edges:', {
    count: parallelEdges.length,
    edges: parallelEdges.map(e => e.id)
  });

  if (parallelEdges.length <= 1) {
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Get node positions safely
  const sourceX = source?.positionAbsolute?.x ?? source?.position?.x ?? 0;
  const sourceY = source?.positionAbsolute?.y ?? source?.position?.y ?? 0;
  const targetX = target?.positionAbsolute?.x ?? target?.position?.x ?? 0;
  const targetY = target?.positionAbsolute?.y ?? target?.position?.y ?? 0;

  // Calculate angle between nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);

  // Find index of current edge
  const edgeIndex = parallelEdges.findIndex((edge) => edge.id === edgeId);
  const centerIndex = (parallelEdges.length - 1) / 2;
  
  // Adjust spacing based on number of edges (decreases as edge count increases)
  const baseSpacing = Math.max(MAX_EDGE_SPACING - parallelEdges.length, MIN_EDGE_SPACING);
  const offset = (edgeIndex - centerIndex) * baseSpacing;

  // Calculate perpendicular offsets based on angle
  const perpX = Math.sin(angle) * offset;
  const perpY = -Math.cos(angle) * offset;

  // Debug: Log calculated offsets
  DEBUG_ENABLED && console.debug('Edge offset calculation:', {
    edgeId,
    edgeIndex,
    centerIndex,
    angle: (angle * 180 / Math.PI).toFixed(2) + '°',
    offset,
    perpX,
    perpY
  });

  return {
    sourceOffset: { x: perpX, y: perpY },
    targetOffset: { x: perpX, y: perpY }
  };
}
