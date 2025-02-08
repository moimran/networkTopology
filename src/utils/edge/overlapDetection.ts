import { Edge } from '@xyflow/react';
import { EdgeOverlapResult } from '../types/edge.types';

/**
 * Detect overlapping edges at a node
 */
export function detectOverlappingEdges(
  nodeId: string,
  currentEdgeId: string,
  edges: Edge[],
  edgeType?: string
): EdgeOverlapResult {
  // Group edges by source/target node
  const edgesByNode = edges.reduce((acc: { source: Edge[], target: Edge[] }, edge) => {
    if (edge.id !== currentEdgeId) { // Exclude current edge
      if (edge.source === nodeId) {
        acc.source.push(edge);
      }
      if (edge.target === nodeId) {
        acc.target.push(edge);
      }
    }
    return acc;
  }, { source: [], target: [] });

  // Filter for edges with same type if specified
  const overlappingEdges = {
    source: edgesByNode.source.filter(edge => 
      (!edgeType || edge.data?.edgeType === edgeType)
    ),
    target: edgesByNode.target.filter(edge => 
      (!edgeType || edge.data?.edgeType === edgeType)
    )
  };

  return {
    hasOverlap: overlappingEdges.source.length > 0 || overlappingEdges.target.length > 0,
    overlappingEdges,
    counts: {
      source: overlappingEdges.source.length,
      target: overlappingEdges.target.length
    }
  };
}
