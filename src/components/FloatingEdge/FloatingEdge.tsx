import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback } from 'react';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'angle-right' | 'angle-left' | 'angle-top' | 'angle-bottom';
  sourceInterface?: string;
  targetInterface?: string;
  showLabels?: boolean;
};

/**
 * Calculate parallel offset for edges between the same nodes
 */
function calculateParallelOffset(
  sourceId: string,
  targetId: string,
  currentEdgeId: string,
  edges: any[],
  spacing: number = 4
): { sourceOffset: { x: number; y: number }; targetOffset: { x: number; y: number } } {
  // Find all edges between these nodes
  const parallelEdges = edges.filter(
    edge => (edge.source === sourceId && edge.target === targetId) ||
            (edge.source === targetId && edge.target === sourceId)
  );

  if (parallelEdges.length <= 1) {
    return { sourceOffset: { x: 0, y: 0 }, targetOffset: { x: 0, y: 0 } };
  }

  // Find the index of the current edge
  const edgeIndex = parallelEdges.findIndex(edge => edge.id === currentEdgeId);
  const totalEdges = parallelEdges.length;
  
  // Calculate offset based on edge position
  const offset = (edgeIndex - (totalEdges - 1) / 2) * spacing;
  
  return {
    sourceOffset: { x: offset, y: offset },
    targetOffset: { x: offset, y: offset }
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
  const { sourceOffset, targetOffset } = calculateParallelOffset(source, target, id, edges);

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

  switch (data?.edgeType) {
    case 'straight': {
      [edgePath] = getStraightPath({
        sourceX: sx + sourceOffset.x,
        sourceY: sy + sourceOffset.y,
        targetX: tx + targetOffset.x,
        targetY: ty + targetOffset.y,
      });
      break;
    }
    case 'step': {
      [edgePath] = getSmoothStepPath({
        sourceX: sx + sourceOffset.x,
        sourceY: sy + sourceOffset.y,
        targetX: tx + targetOffset.x,
        targetY: ty + targetOffset.y,
        borderRadius: 0,
      });
      break;
    }
    case 'smoothstep': {
      [edgePath] = getSmoothStepPath({
        sourceX: sx + sourceOffset.x,
        sourceY: sy + sourceOffset.y,
        targetX: tx + targetOffset.x,
        targetY: ty + targetOffset.y,
        borderRadius: 16,
      });
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
      } else {
        showWarningOnce(direction);
        edgePath = getStraightPath({
          sourceX: sx + sourceOffset.x,
          sourceY: sy + sourceOffset.y,
          targetX: tx + targetOffset.x,
          targetY: ty + targetOffset.y,
        })[0];
      }
      break;
    }
    default: {
      [edgePath] = getBezierPath({
        sourceX: sx + sourceOffset.x,
        sourceY: sy + sourceOffset.y,
        targetX: tx + targetOffset.x,
        targetY: ty + targetOffset.y,
      });
    }
  }

  return (
    <>
      <path
        className={`floating-edge-path ${selected ? 'selected' : ''}`}
        d={edgePath}
        fill="none"
        strokeWidth={2}
        stroke="currentColor"
        style={style}
      />
      {data?.showLabels && (
        <>
          {data.sourceInterface && (
            <text
              x={sx + sourceOffset.x}
              y={sy + sourceOffset.y - 10}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="edge-label"
            >
              {data.sourceInterface}
            </text>
          )}
          {data.targetInterface && (
            <text
              x={tx + targetOffset.x}
              y={ty + targetOffset.y - 10}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="edge-label"
            >
              {data.targetInterface}
            </text>
          )}
        </>
      )}
    </>
  );
}

export default FloatingEdge;
