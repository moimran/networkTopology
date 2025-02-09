import { Edge, Node } from '@xyflow/react';
import { EdgeOffsets } from '../types/edge.types';
import { MAX_EDGE_SPACING, MIN_EDGE_SPACING, DEBUG_ENABLED } from './constants';

/**
 * Calculates offset values for parallel edges to prevent overlapping.
 * 
 * When multiple edges connect the same pair of nodes, this function calculates
 * appropriate offsets to spread them out perpendicular to the line between the nodes.
 * 
 * The algorithm works as follows:
 * 1. Identifies all edges between the same pair of nodes (parallel edges)
 * 2. Calculates the angle between the nodes to determine offset direction
 * 3. Distributes edges evenly around the center line using perpendicular offsets
 * 4. Adjusts spacing based on the number of parallel edges
 * 
 * @param source - Source node of the edge
 * @param target - Target node of the edge
 * @param edgeId - ID of the current edge being calculated
 * @param edges - Array of all edges in the graph
 * @returns EdgeOffsets - Object containing x,y offsets for both source and target points
 * 
 * Example:
 * For 3 parallel edges between nodes A and B:
 * ```
 *    Edge 1   ------>
 *    Edge 2 ==========>  (Center line)
 *    Edge 3   ------>
 * ```
 * 
 * The offset calculation ensures:
 * - Edges are evenly spaced above and below the center line
 * - Spacing adapts to the number of edges (more edges = smaller spacing)
 * - Maintains consistent offset direction relative to edge angle
 */
export function calculateParallelOffset(
  source: Node,
  target: Node,
  edgeId: string,
  edges: Edge[]
): EdgeOffsets {
  // Validate input nodes
  if (!source || !target) {
    DEBUG_ENABLED && console.debug('Missing node data:', { source, target, edgeId });
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Find all edges between the same pair of nodes (in either direction)
  const parallelEdges = edges.filter(
    (edge) => (
      (edge.source === source?.id && edge.target === target?.id) ||
      (edge.source === target?.id && edge.target === source?.id)
    )
  );

  DEBUG_ENABLED && console.debug('Parallel edges:', {
    count: parallelEdges.length,
    edges: parallelEdges.map(e => e.id)
  });

  // If there's only one edge or no parallel edges, no offset needed
  if (parallelEdges.length <= 1) {
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Get node positions, falling back to defaults if needed
  const sourceX = source?.positionAbsolute?.x ?? source?.position?.x ?? 0;
  const sourceY = source?.positionAbsolute?.y ?? source?.position?.y ?? 0;
  const targetX = target?.positionAbsolute?.x ?? target?.position?.x ?? 0;
  const targetY = target?.positionAbsolute?.y ?? target?.position?.y ?? 0;

  // Calculate angle between nodes using arctangent
  // This gives us the direction of the line between the nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  console.log('Angle calculation:', { dx, dy });
  const angle = Math.atan2(dy, dx);
  console.log('Calculated angle:', angle);

  // Find the relative position of this edge among parallel edges
  const edgeIndex = parallelEdges.findIndex((edge) => edge.id === edgeId);
  // Calculate center index for even distribution around the center line
  const centerIndex = (parallelEdges.length - 1) / 2;
  
  // Calculate spacing between edges
  // As the number of edges increases, spacing decreases (but never below MIN_EDGE_SPACING)
  const baseSpacing = Math.max(MAX_EDGE_SPACING - parallelEdges.length, MIN_EDGE_SPACING);
  // Calculate offset from center line based on edge position
  const offset = (edgeIndex - centerIndex) * baseSpacing;

  // Calculate perpendicular offset components
  // Uses trigonometry to get offset vector perpendicular to edge direction:
  // - perpX = sin(angle) * offset  -> X component of perpendicular vector
  // - perpY = -cos(angle) * offset -> Y component of perpendicular vector
  const perpX = Math.sin(angle) * offset;
  const perpY = -Math.cos(angle) * offset;

  DEBUG_ENABLED && console.debug('Edge offset calculation:', {
    edgeId,
    edgeIndex,
    centerIndex,
    angle: (angle * 180 / Math.PI).toFixed(2) + '°',
    offset,
    perpX,
    perpY
  });

  // Return same offset for both source and target to maintain parallel edges
  return {
    sourceOffset: { x: perpX, y: perpY },
    targetOffset: { x: perpX, y: perpY }
  };
}

/**
 * Calculates offset for edges that share the same source node and have 90-degree angles.
 * This prevents overlapping when multiple edges start from the same point.
 * 
 * The function works by:
 * 1. Finding all edges that share the same source node
 * 2. Calculating offset based on the edge's position and direction
 * 3. Applying smaller spacing for shared source edges
 * 
 * @param source Source node
 * @param target Target node
 * @param edgeId Current edge ID
 * @param edges All edges in the graph
 * @param direction Direction of the current edge (right, left, top, bottom)
 * @returns EdgeOffsets with adjusted start positions
 */
export function calculate90DegreeOffset(
  source: Node,
  target: Node,
  edgeId: string,
  edges: Edge[],
  direction: 'right' | 'left' | 'top' | 'bottom'
): EdgeOffsets {
  if (!source || !target) {
    DEBUG_ENABLED && console.debug('Missing node data:', { source, target, edgeId });
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Find edges that share the same source node
  const sourceEdges = edges.filter(edge => edge.source === source.id);
  
  // If no other edges from this source, no offset needed
  if (sourceEdges.length <= 1) {
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  DEBUG_ENABLED && console.debug('Edge analysis:', {
    sourceEdgesCount: sourceEdges.length,
    edges: sourceEdges.map(e => e.id)
  });

  // Get node positions
  const sourceX = source?.positionAbsolute?.x ?? source?.position?.x ?? 0;
  const sourceY = source?.positionAbsolute?.y ?? source?.position?.y ?? 0;
  const targetX = target?.positionAbsolute?.x ?? target?.position?.x ?? 0;
  const targetY = target?.positionAbsolute?.y ?? target?.position?.y ?? 0;

  // Calculate relative position of current edge
  const edgeIndex = sourceEdges.findIndex((edge) => edge.id === edgeId);
  const totalEdges = sourceEdges.length;
  
  // Use smaller spacing for shared source edges
  const baseSpacing = Math.max(MAX_EDGE_SPACING / 2 - totalEdges, MIN_EDGE_SPACING);
  
  // Calculate center index and offset
  const centerIndex = (totalEdges - 1) / 2;
  const offset = (edgeIndex - centerIndex) * baseSpacing;

  // Calculate dx and dy for direction determination
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const isHorizontal = Math.abs(dx) > Math.abs(dy);

  // For horizontal edges (right/left), offset vertically
  if (isHorizontal || direction === 'right' || direction === 'left') {
    return {
      sourceOffset: { x: 0, y: offset },
      targetOffset: { x: 0, y: offset }
    };
  }
  // For vertical edges (top/bottom), offset horizontally
  else {
    return {
      sourceOffset: { x: offset, y: 0 },
      targetOffset: { x: offset, y: 0 }
    };
  }
}
