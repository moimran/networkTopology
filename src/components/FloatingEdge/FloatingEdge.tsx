import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback } from 'react';

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

function FloatingEdge({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) {
  const { sourceNode, targetNode, edges } = useStore((s) => ({
    sourceNode: s.nodeLookup.get(source),
    targetNode: s.nodeLookup.get(target),
    edges: s.edges
  }));

  if (!sourceNode || !targetNode) {
    console.log('Missing nodes for edge', { id, source, target });
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
  
  // Calculate offset if there are multiple edges between these nodes
  const { sourceOffset, targetOffset } = calculateParallelOffset(sourceNode, targetNode, id, edges);

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

  // Get the appropriate path based on edge type
  let edgePath = '';
  let [sourceX, sourceY] = [sx + sourceOffset.x, sy + sourceOffset.y];
  let [targetX, targetY] = [tx + targetOffset.x, ty + targetOffset.y];

  // Calculate label positions at a fixed distance from nodes
  const LABEL_DISTANCE = 40; // pixels from node
  let sourceLabelX = 0, sourceLabelY = 0;
  let targetLabelX = 0, targetLabelY = 0;

  switch (data?.edgeType) {
    case 'straight': {
      [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      // Calculate angle between nodes
      const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
      sourceLabelX = sourceX + Math.cos(angle) * LABEL_DISTANCE;
      sourceLabelY = sourceY + Math.sin(angle) * LABEL_DISTANCE;
      targetLabelX = targetX - Math.cos(angle) * LABEL_DISTANCE;
      targetLabelY = targetY - Math.sin(angle) * LABEL_DISTANCE;
      break;
    }
    case 'step':
    case 'smoothstep': {
      const borderRadius = data?.edgeType === 'step' ? 0 : 16;
      [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        borderRadius,
      });
      // For step edges, position labels horizontally from nodes
      sourceLabelX = sourceX + LABEL_DISTANCE;
      sourceLabelY = sourceY;
      targetLabelX = targetX - LABEL_DISTANCE;
      targetLabelY = targetY;
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
        // Position labels based on the angle direction
        switch (direction) {
          case 'right':
            sourceLabelX = sourceX + LABEL_DISTANCE;
            sourceLabelY = sourceY;
            targetLabelX = targetX - LABEL_DISTANCE;
            targetLabelY = targetY;
            break;
          case 'left':
            sourceLabelX = sourceX - LABEL_DISTANCE;
            sourceLabelY = sourceY;
            targetLabelX = targetX + LABEL_DISTANCE;
            targetLabelY = targetY;
            break;
          case 'top':
            sourceLabelX = sourceX;
            sourceLabelY = sourceY - LABEL_DISTANCE;
            targetLabelX = targetX;
            targetLabelY = targetY + LABEL_DISTANCE;
            break;
          case 'bottom':
            sourceLabelX = sourceX;
            sourceLabelY = sourceY + LABEL_DISTANCE;
            targetLabelX = targetX;
            targetLabelY = targetY - LABEL_DISTANCE;
            break;
        }
      } else {
        showWarningOnce(direction);
        [edgePath] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        sourceLabelX = sourceX + Math.cos(angle) * LABEL_DISTANCE;
        sourceLabelY = sourceY + Math.sin(angle) * LABEL_DISTANCE;
        targetLabelX = targetX - Math.cos(angle) * LABEL_DISTANCE;
        targetLabelY = targetY - Math.sin(angle) * LABEL_DISTANCE;
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
      sourceLabelX = sourceX + Math.cos(angle) * LABEL_DISTANCE;
      sourceLabelY = sourceY + Math.sin(angle) * LABEL_DISTANCE;
      targetLabelX = targetX - Math.cos(angle) * LABEL_DISTANCE;
      targetLabelY = targetY - Math.sin(angle) * LABEL_DISTANCE;
    }
  }

  const defaultStyle = {
    strokeWidth: 1.5,
    stroke: '#b1b1b7',
    ...style
  };

  // Use interface labels if available, fall back to interface names
  const sourceText = data?.sourceInterfaceLabel || data?.sourceInterface || 'E1/1';
  const targetText = data?.targetInterfaceLabel || data?.targetInterface || 'E1/1';

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

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={defaultStyle}
      />
      {data?.showLabels && (
        <EdgeLabelRenderer>
          <div
            style={{
              ...labelStyle,
              left: sourceLabelX,
              top: sourceLabelY,
            }}
            className="nodrag nopan"
          >
            {sourceText}
          </div>
          <div
            style={{
              ...labelStyle,
              left: targetLabelX,
              top: targetLabelY,
            }}
            className="nodrag nopan"
          >
            {targetText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default FloatingEdge;
