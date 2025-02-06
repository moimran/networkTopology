import { CSSProperties } from 'react';
import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep';
  sourceInterface?: string;
  targetInterface?: string;
  showLabels?: boolean;
};

function FloatingEdge({ id, source, target, style, data }: EdgeProps<FloatingEdgeData>) {
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

  // Debug output for edge parameters
  console.log('Edge parameters:', {
    id,
    source: {
      x: sx,
      y: sy,
      pos: sourcePos,
      nodeCenter: {
        x: sourceNode.position.x + (sourceNode.measured?.width ?? 0) / 2,
        y: sourceNode.position.y + (sourceNode.measured?.height ?? 0) / 2
      }
    },
    target: {
      x: tx,
      y: ty,
      pos: targetPos,
      nodeCenter: {
        x: targetNode.position.x + (targetNode.measured?.width ?? 0) / 2,
        y: targetNode.position.y + (targetNode.measured?.height ?? 0) / 2
      }
    }
  });

  // Calculate angle between nodes
  const dx = tx - sx;
  const dy = ty - sy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  console.log('Edge angle:', { angle, dx, dy });

  let path = '';
  
  // Handle different edge types based on data.edgeType
  switch (data?.edgeType) {
    case 'straight':
      [path] = getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
      });
      break;
    case 'step':
      [path] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
        borderRadius: 0,
      });
      break;
    case 'smoothstep':
      [path] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
        borderRadius: 8,
        offset: 25
      });
      break;
    default:
      // Use angle-based logic for default edge type
      if ((angle > 60 && angle < 120) || (angle < -60 && angle > -120)) {
        console.log('Using straight path due to angle', { angle });
        [path] = getStraightPath({
          sourceX: sx,
          sourceY: sy,
          targetX: tx,
          targetY: ty,
        });
      } else {
        console.log('Using bezier path', { angle });
        [path] = getBezierPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetPosition: targetPos,
          targetX: tx,
          targetY: ty,
          curvature: 0.1
        });
      }
  }

  // Calculate the middle point for label positioning
  const labelX = (sx + tx) / 2;
  const labelY = (sy + ty) / 2;

  return (
    <>
      <g className="react-flow__connection">
        <path 
          id={id} 
          className="react-flow__edge-path" 
          d={path} 
          style={{
            ...style,
            strokeWidth: 2,
            stroke: '#4a90e2',
          } as CSSProperties} 
        />
      </g>
      {data?.showLabels && data?.sourceInterface && data?.targetInterface && (
        <foreignObject
          width={200}
          height={40}
          x={labelX - 100}
          y={labelY - 20}
          className="edge-label-container"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="edge-label">
            <span className="interface-label source">
              {data.sourceInterface}
            </span>
            <span className="interface-label target">
              {data.targetInterface}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
}

export default FloatingEdge;
