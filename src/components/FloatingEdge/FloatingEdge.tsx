import { CSSProperties } from 'react';
import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep';
  sourceInterface?: string;
  targetInterface?: string;
  showLabels?: boolean;
};

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
  const pathParams = [sx, sy, tx, ty] as const;

  switch (data?.edgeType) {
    case 'straight':
      [edgePath] = getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
      });
      break;
    case 'step':
      [edgePath] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        borderRadius: 10,
      });
      break;
    case 'smoothstep':
      [edgePath] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        borderRadius: 16,
      });
      break;
    default:
      [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
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
