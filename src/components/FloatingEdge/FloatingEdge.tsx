import { CSSProperties } from 'react';
import { EdgeProps, useStore, getBezierPath } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { logger } from '../../utils/logger';

export type FloatingEdgeData = {
  sourceInterface?: string;
  targetInterface?: string;
};

function FloatingEdge({ id, source, target, style, data }: EdgeProps<FloatingEdgeData>) {
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));

  if (!sourceNode || !targetNode) {
    logger.debug('Missing nodes for edge', { id, source, target });
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

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
      {data?.sourceInterface && data?.targetInterface && (
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
