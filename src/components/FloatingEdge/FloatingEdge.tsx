import { CSSProperties } from 'react';
import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'angle-right' | 'angle-left' | 'angle-top' | 'angle-bottom';
  sourceInterface?: string;
  targetInterface?: string;
  showLabels?: boolean;
};

/**
 * Calculate center point for angled edges
 */
function getAngleCenter(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePos: Position,
  targetPos: Position,
  direction: 'right' | 'left' | 'top' | 'bottom'
): { centerX: number; centerY: number } {
  // Calculate the midpoint between source and target
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  switch (direction) {
    case 'right':
      return {
        centerX: Math.max(sourceX, targetX),
        centerY: sourceY,
      };
    case 'left':
      return {
        centerX: Math.min(sourceX, targetX),
        centerY: sourceY,
      };
    case 'top':
      return {
        centerX: targetX,
        centerY: Math.min(sourceY, targetY),
      };
    case 'bottom':
      return {
        centerX: targetX,
        centerY: Math.max(sourceY, targetY),
      };
  }
}

function FloatingEdge({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) {
  const { sourceNode, targetNode } = useStore((s) => {
    const sourceNode = s.nodeLookup.get(source);
    const targetNode = s.nodeLookup.get(target);
    return { sourceNode, targetNode };
  });

  if (!sourceNode || !targetNode) {
    console.log('Missing nodes for edge', { id, source, target });
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  // Get the appropriate path based on edge type
  let edgePath = '';

  switch (data?.edgeType) {
    case 'straight':
      [edgePath] = getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });
      break;
    case 'step':
      [edgePath] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        borderRadius: 0,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });
      break;
    case 'smoothstep':
      [edgePath] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        borderRadius: 16,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });
      break;
    case 'angle-right':
    case 'angle-left':
    case 'angle-top':
    case 'angle-bottom': {
      const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
      const { centerX, centerY } = getAngleCenter(sx, sy, tx, ty, sourcePos, targetPos, direction);
      
      // Create a custom path for the 90-degree angle
      const path = [];
      
      // Move to start point
      path.push(`M ${sx} ${sy}`);
      
      // Create the 90-degree angle based on direction
      switch (direction) {
        case 'right':
          path.push(`L ${centerX} ${sy}`);
          path.push(`L ${centerX} ${ty}`);
          break;
        case 'left':
          path.push(`L ${centerX} ${sy}`);
          path.push(`L ${centerX} ${ty}`);
          break;
        case 'top':
          path.push(`L ${sx} ${centerY}`);
          path.push(`L ${tx} ${centerY}`);
          break;
        case 'bottom':
          path.push(`L ${sx} ${centerY}`);
          path.push(`L ${tx} ${centerY}`);
          break;
      }
      
      // Line to end point
      path.push(`L ${tx} ${ty}`);
      
      edgePath = path.join(' ');
      break;
    }
    default:
      [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });
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
              x={sx}
              y={sy - 10}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="edge-label"
            >
              {data.sourceInterface}
            </text>
          )}
          {data.targetInterface && (
            <text
              x={tx}
              y={ty - 10}
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
