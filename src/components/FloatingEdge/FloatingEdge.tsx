import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback, memo, useLayoutEffect, useState } from 'react';
import {
  calculate90DegreePath,
  calculateParallelOffset,
  calculate90DegreeOffset,
  calculateStraightLabelPositions,
  calculateStepLabelPositions,
  calculateAngleLabelPositions,
  detectOverlappingEdges,
  LABEL_DISTANCE
} from '../../utils/edge';
import { FloatingEdgeData, EdgePositions } from '../../utils/types/edge.types';

/**
 * Default style configuration for edge labels
 * Provides a clean, readable appearance with a light background and subtle shadow
 */
const labelStyle = {
  position: 'absolute',
  background: '#e6f3ff',
  padding: '1px 2px',
  borderRadius: '4px',
  fontSize: '8px',
  fontWeight: 500,
  color: '#333',
  border: '1px solid #ccc',
  boxShadow: '0 0 2px rgba(0,0,0,0.1)',
  pointerEvents: 'all',
  transform: 'translate(-50%, -50%)', // Center the label on the point
  zIndex: 1000,
} as const;

/**
 * FloatingEdge Component
 * 
 * A specialized edge component that supports multiple edge types and automatic label positioning.
 * This component handles different edge styles including:
 * - Straight edges
 * - Step edges (with optional smoothing)
 * - 90-degree angled edges in four directions (right, left, top, bottom)
 * 
 * Features:
 * - Automatic parallel edge offsetting to prevent overlaps
 * - Dynamic label positioning based on edge type
 * - Overlap detection and warning system
 * - Support for custom edge styles and labels
 * 
 * @param props EdgeProps containing edge data and style information
 * @returns JSX.Element | null
 */
const FloatingEdge = memo(({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) => {
  // State to store calculated positions for edge path and labels
  const [labelPositions, setLabelPositions] = useState<EdgePositions>({
    source: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    path: ''
  });

  // Get nodes and edges from React Flow store
  // Using selector pattern to optimize re-renders
  const { sourceNode, targetNode, edges } = useStore(
    (s) => ({
      sourceNode: s.nodeLookup.get(source),
      targetNode: s.nodeLookup.get(target),
      edges: s.edges
    }),
    (prev, next) => {
      // Custom comparison function to prevent unnecessary updates
      const sourceEqual = 
        prev.sourceNode?.position.x === next.sourceNode?.position.x &&
        prev.sourceNode?.position.y === next.sourceNode?.position.y;
      const targetEqual = 
        prev.targetNode?.position.x === next.targetNode?.position.x &&
        prev.targetNode?.position.y === next.targetNode?.position.y;
      const edgesEqual = prev.edges === next.edges;
      return sourceEqual && targetEqual && edgesEqual;
    }
  );

  // Ref to track warning messages and prevent duplicates
  const warningShownRef = useRef<{ [key: string]: boolean }>({});
  
  // Show warning only once for each edge/direction combination
  const showWarningOnce = useCallback((direction: string) => {
    const warningKey = `${id}-${direction}`;
    if (!warningShownRef.current[warningKey]) {
      console.warn(
        `Cannot create 90-degree ${direction} angle between nodes:`,
        { source, target, direction }
      );
      warningShownRef.current[warningKey] = true;
    }
  }, [id, source, target]);

  // Calculate edge path and label positions whenever nodes move or edge data changes
  useLayoutEffect(() => {
    if (!sourceNode || !targetNode) {
      return;
    }

    // Get base edge parameters and calculate offsets for parallel edges
    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
    console.log('get params sx, sy, tx, ty', sx, sy, tx, ty, data);
    
    let sourceOffset, targetOffset;
    
    // Use different offset calculation for 90-degree angles
    if (data?.edgeType?.startsWith('angle-')) {
      const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
      ({ sourceOffset, targetOffset } = calculate90DegreeOffset(sourceNode, targetNode, id, edges, direction));
    } else {
      ({ sourceOffset, targetOffset } = calculateParallelOffset(sourceNode, targetNode, id, edges));
    }

    // Apply offsets to edge endpoints
    const sourceX = sx + sourceOffset.x;
    const sourceY = sy + sourceOffset.y;
    const targetX = tx + targetOffset.x;
    const targetY = ty + targetOffset.y;

    let edgePath = '';
    let labelPos;

    // Calculate path based on edge type
    switch (data?.edgeType) {
      case 'straight': {
        // Simple straight line between points
        [edgePath] = getStraightPath({
          sourceX, sourceY, targetX, targetY
        });
        labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
        break;
      }
      case 'step':
      case 'smoothstep': {
        // Step path with optional smoothing
        const borderRadius = data?.edgeType === 'step' ? 0 : 16;
        [edgePath] = getSmoothStepPath({
          sourceX, sourceY, targetX, targetY, borderRadius
        });
        labelPos = calculateStepLabelPositions(sourceX, sourceY, targetX, targetY);
        break;
      }
      case 'angle-right':
      case 'angle-left':
      case 'angle-top':
      case 'angle-bottom': {
        // 90-degree angled path
        const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
        const anglePath = calculate90DegreePath(sourceX, sourceY, targetX, targetY, direction, sourceOffset, targetOffset);
        
        if (anglePath) {
          edgePath = anglePath;
          labelPos = calculateAngleLabelPositions(sourceX, sourceY, targetX, targetY, direction);
        } else {
          // Fallback to straight path if 90-degree angle isn't possible
          showWarningOnce(direction);
          [edgePath] = getStraightPath({
            sourceX, sourceY, targetX, targetY
          });
          labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
        }
        break;
      }
      default: {
        // Default to bezier curve for unknown edge types
        [edgePath] = getBezierPath({
          sourceX, sourceY, targetX, targetY
        });
        labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
      }
    }

    // Update state with calculated positions
    setLabelPositions({
      source: labelPos.source,
      target: labelPos.target,
      path: edgePath
    });
  }, [sourceNode, targetNode, data?.edgeType, edges, id, source, target, showWarningOnce]);

  // Detect and log edge overlaps for debugging
  useLayoutEffect(() => {
    if (!sourceNode || !targetNode) return;

    // Check for overlaps at source node
    const sourceOverlaps = detectOverlappingEdges(source, id, edges, data?.edgeType);
    if (sourceOverlaps.hasOverlap) {
      console.log(`Edge ${id} overlaps at source node ${source}:`, {
        edgeType: data?.edgeType,
        overlappingEdges: sourceOverlaps.overlappingEdges.source.map(e => ({
          id: e.id,
          type: e.data?.edgeType
        })),
        totalOverlaps: sourceOverlaps.counts.source
      });
    }

    // Check for overlaps at target node
    const targetOverlaps = detectOverlappingEdges(target, id, edges, data?.edgeType);
    if (targetOverlaps.hasOverlap) {
      console.log(`Edge ${id} overlaps at target node ${target}:`, {
        edgeType: data?.edgeType,
        overlappingEdges: targetOverlaps.overlappingEdges.target.map(e => ({
          id: e.id,
          type: e.data?.edgeType
        })),
        totalOverlaps: targetOverlaps.counts.target
      });
    }
  }, [id, source, target, edges, data?.edgeType, sourceNode, targetNode]);

  // Don't render if either node is missing
  if (!sourceNode || !targetNode) {
    return null;
  }

  return (
    <>
      {/* Edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={labelPositions.path}
        style={style}
      />
      
      {/* Edge labels */}
      {data?.showLabels && (
        <EdgeLabelRenderer>
          {/* Source interface label */}
          <div
            style={{
              ...labelStyle,
              left: labelPositions.source.x,
              top: labelPositions.source.y,
            }}
            className="nodrag nopan"
          >
            {data?.sourceInterfaceLabel || data?.sourceInterface || 'E1/1'}
          </div>
          
          {/* Target interface label */}
          <div
            style={{
              ...labelStyle,
              left: labelPositions.target.x,
              top: labelPositions.target.y,
            }}
            className="nodrag nopan"
          >
            {data?.targetInterfaceLabel || data?.targetInterface || 'E1/1'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

FloatingEdge.displayName = 'FloatingEdge';

export default FloatingEdge;
