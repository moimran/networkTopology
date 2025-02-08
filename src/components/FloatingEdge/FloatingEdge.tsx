import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback, memo, useLayoutEffect, useState } from 'react';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'angle-right' | 'angle-left' | 'angle-top' | 'angle-bottom';
  sourceInterface?: string;
  targetInterface?: string;
  sourceInterfaceLabel?: string;
  targetInterfaceLabel?: string;
  showLabels?: boolean;
};

/**
 * Calculate offset for parallel edges considering the angle between nodes
 */
function calculateParallelOffset(source: any, target: any, edgeId: string, edges: any[]): { sourceOffset: { x: number; y: number }, targetOffset: { x: number; y: number } } {
  // Debug: Log input parameters
  if (!source || !target) {
    console.debug('Missing node data:', { source, target, edgeId });
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
  console.debug('Parallel edges:', {
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
  const baseSpacing = Math.max(8 - parallelEdges.length, 2); // Minimum 4px spacing
  const offset = (edgeIndex - centerIndex) * baseSpacing;

  // Calculate perpendicular offsets based on angle
  const perpX = Math.sin(angle) * offset;
  const perpY = -Math.cos(angle) * offset;

  // Debug: Log calculated offsets
  console.debug('Edge offset calculation:', {
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

/**
 * Calculate if a 90-degree angle is possible based on node positions
 */
function canCreate90DegreeAngle(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  direction: 'right' | 'left' | 'top' | 'bottom'
): boolean {
  const xDiff = Math.abs(targetX - sourceX);
  const yDiff = Math.abs(targetY - sourceY);
  const minDistance = 20; // Minimum distance required for a 90-degree angle

  switch (direction) {
    case 'right':
      return targetX > sourceX + minDistance;
    case 'left':
      return targetX < sourceX - minDistance;
    case 'top':
      return targetY < sourceY - minDistance;
    case 'bottom':
      return targetY > sourceY + minDistance;
  }
}

/**
 * Calculate the path for a 90-degree angle
 */
function calculate90DegreePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  direction: 'right' | 'left' | 'top' | 'bottom',
  sourceOffset: { x: number; y: number },
  targetOffset: { x: number; y: number }
): string | null {
  // Apply offsets to center points
  const sx = sourceX + sourceOffset.x;
  const sy = sourceY + sourceOffset.y;
  const tx = targetX + targetOffset.x;
  const ty = targetY + targetOffset.y;

  // Check if we can create a 90-degree angle
  if (!canCreate90DegreeAngle(sx, sy, tx, ty, direction)) {
    return null;
  }

  const path = [];
  path.push(`M ${sx} ${sy}`);

  // Calculate the 90-degree angle path
  switch (direction) {
    case 'right': {
      // Move right from source, then up/down to target
      path.push(`L ${tx} ${sy}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
    case 'left': {
      // Move left from source, then up/down to target
      path.push(`L ${tx} ${sy}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
    case 'top': {
      // Move up from source, then left/right to target
      path.push(`L ${sx} ${ty}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
    case 'bottom': {
      // Move down from source, then left/right to target
      path.push(`L ${sx} ${ty}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
  }

  return path.join(' ');
}

// Memoized edge component
const FloatingEdge = memo(({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) => {
  // Add state for label positions
  const [labelPositions, setLabelPositions] = useState({
    source: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    path: ''
  });

  const { sourceNode, targetNode, edges } = useStore(
    (s) => ({
      sourceNode: s.nodeLookup.get(source),
      targetNode: s.nodeLookup.get(target),
      edges: s.edges
    }),
    (prev, next) => {
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

  const warningShownRef = useRef<{ [key: string]: boolean }>({});
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

  // Calculate positions synchronously before paint
  useLayoutEffect(() => {
    if (!sourceNode || !targetNode) {
      return;
    }

    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
    const { sourceOffset, targetOffset } = calculateParallelOffset(sourceNode, targetNode, id, edges);

    let edgePath = '';
    let sourceLabelX = 0, sourceLabelY = 0;
    let targetLabelX = 0, targetLabelY = 0;

    const sourceX = sx + sourceOffset.x;
    const sourceY = sy + sourceOffset.y;
    const targetX = tx + targetOffset.x;
    const targetY = ty + targetOffset.y;

    // All the existing edge path and label position calculations
    switch (data?.edgeType) {
      case 'straight': {
        [edgePath] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        sourceLabelX = sourceX + Math.cos(angle) * 40;
        sourceLabelY = sourceY + Math.sin(angle) * 40;
        targetLabelX = targetX - Math.cos(angle) * 40;
        targetLabelY = targetY - Math.sin(angle) * 40;
        break;
      }
      case "step":
      case "smoothstep": {
        const borderRadius = data?.edgeType === "step" ? 0 : 16;
        [edgePath] = getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          borderRadius,
        });
        // For step edges, position labels horizontally from nodes
        const middlePoint = (targetY - sourceY) / 2;
        const isConjusted = middlePoint < 40 + 15;

        const delta = isConjusted ? middlePoint : 40;
  
        const isOpposite = targetY - sourceY < 20;
  
        sourceLabelX = sourceX;
        sourceLabelY = sourceY + (isOpposite ? 20 : delta);
        targetLabelX = targetX;
        targetLabelY = targetY - (isOpposite ? 20 : delta);
        break;
      }
      case 'angle-right':
      case 'angle-left':
      case 'angle-top':
      case 'angle-bottom': {
        const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
        const anglePath = calculate90DegreePath(sx, sy, tx, ty, direction, sourceOffset, targetOffset);
        
        if (anglePath) {
          edgePath = anglePath;
          
          // Determine relative positions of nodes
          const isSourceLeftOfTarget = sourceX < targetX;
          const isSourceAboveTarget = sourceY < targetY;

          // Position labels based on both direction and relative positions
          switch (direction) {
            case 'right':
              if (isSourceLeftOfTarget) {
                // Normal case: source -> right -> down/up -> target
                sourceLabelX = sourceX + 40;
                sourceLabelY = sourceY;
                targetLabelX = targetX;
                targetLabelY = targetY + (isSourceAboveTarget ? -40 : 40);
              } else {
                // Reverse case: source <- right <- down/up <- target
                sourceLabelX = sourceX - 40;
                sourceLabelY = sourceY;
                targetLabelX = targetX;
                targetLabelY = targetY + (isSourceAboveTarget ? -40 : 40);
              }
              break;
            case 'left':
              if (isSourceLeftOfTarget) {
                // Reverse case: source -> left -> down/up -> target
                sourceLabelX = sourceX + 40;
                sourceLabelY = sourceY;
                targetLabelX = targetX;
                targetLabelY = targetY + (isSourceAboveTarget ? -40 : 40);
              } else {
                // Normal case: source <- left <- down/up <- target
                sourceLabelX = sourceX - 40;
                sourceLabelY = sourceY;
                targetLabelX = targetX;
                targetLabelY = targetY + (isSourceAboveTarget ? -40 : 40);
              }
              break;
            case 'top':
              if (isSourceAboveTarget) {
                // Normal case: source -> up -> right/left -> target
                sourceLabelX = sourceX;
                sourceLabelY = sourceY - 40;
                targetLabelX = targetX + (isSourceLeftOfTarget ? -40 : 40);
                targetLabelY = targetY;
              } else {
                // Reverse case: source <- up <- right/left <- target
                sourceLabelX = sourceX;
                sourceLabelY = sourceY + 40;
                targetLabelX = targetX + (isSourceLeftOfTarget ? -40 : 40);
                targetLabelY = targetY;
              }
              break;
            case 'bottom':
              if (isSourceAboveTarget) {
                // Normal case: source -> down -> right/left -> target
                sourceLabelX = sourceX;
                sourceLabelY = sourceY + 40;
                targetLabelX = targetX + (isSourceLeftOfTarget ? -40 : 40);
                targetLabelY = targetY;
              } else {
                // Reverse case: source <- down <- right/left <- target
                sourceLabelX = sourceX;
                sourceLabelY = sourceY - 40;
                targetLabelX = targetX + (isSourceLeftOfTarget ? -40 : 40);
                targetLabelY = targetY;
              }
              break;
          }

          // Add debug output
          console.log('Angle edge label positions:', {
            direction,
            isSourceLeftOfTarget,
            isSourceAboveTarget,
            sourcePos: { x: sourceLabelX, y: sourceLabelY },
            targetPos: { x: targetLabelX, y: targetLabelY }
          });
        } else {
          showWarningOnce(direction);
          [edgePath] = getStraightPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
          });
          const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
          sourceLabelX = sourceX + Math.cos(angle) * 40;
          sourceLabelY = sourceY + Math.sin(angle) * 40;
          targetLabelX = targetX - Math.cos(angle) * 40;
          targetLabelY = targetY - Math.sin(angle) * 40;
        }
        break;
      }
      default: {
        [edgePath] = getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        // For bezier curves, use the same approach as straight lines
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        sourceLabelX = sourceX + Math.cos(angle) * 40;
        sourceLabelY = sourceY + Math.sin(angle) * 40;
        targetLabelX = targetX - Math.cos(angle) * 40;
        targetLabelY = targetY - Math.sin(angle) * 40;
      }
    }

    setLabelPositions({
      source: { x: sourceLabelX, y: sourceLabelY },
      target: { x: targetLabelX, y: targetLabelY },
      path: edgePath
    });
  }, [sourceNode, targetNode, data?.edgeType, edges, id]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Use calculated positions from state
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={labelPositions.path}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
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
            left: labelPositions.source.x,
            top: labelPositions.source.y,
          }}
          className="nodrag nopan"
        >
          {data?.sourceInterfaceLabel || data?.sourceInterface || 'E1/1'}
        </div>
        <div
          style={{
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
            left: labelPositions.target.x,
            top: labelPositions.target.y,
          }}
          className="nodrag nopan"
        >
          {data?.targetInterfaceLabel || data?.targetInterface || 'E1/1'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

// Add display name for debugging
FloatingEdge.displayName = 'FloatingEdge';

export default FloatingEdge;
