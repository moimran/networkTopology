import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback, memo, useLayoutEffect, useState } from 'react';
import {
  calculate90DegreePath,
  calculateParallelOffset,
  calculateStraightLabelPositions,
  calculateStepLabelPositions,
  calculateAngleLabelPositions,
  detectOverlappingEdges,
  LABEL_DISTANCE
} from '../../utils/edge';
import { FloatingEdgeData, EdgePositions } from '../../utils/types/edge.types';

/**
 * Default style for edge labels
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
 * FloatingEdge component for rendering edges with labels
 */
const FloatingEdge = memo(({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) => {
  const [labelPositions, setLabelPositions] = useState<EdgePositions>({
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

  useLayoutEffect(() => {
    if (!sourceNode || !targetNode) {
      return;
    }

    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
    const { sourceOffset, targetOffset } = calculateParallelOffset(sourceNode, targetNode, id, edges);

    const sourceX = sx + sourceOffset.x;
    const sourceY = sy + sourceOffset.y;
    const targetX = tx + targetOffset.x;
    const targetY = ty + targetOffset.y;

    let edgePath = '';
    let labelPos;

    switch (data?.edgeType) {
      case 'straight': {
        [edgePath] = getStraightPath({
          sourceX, sourceY, targetX, targetY
        });
        labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
        break;
      }
      case 'step':
      case 'smoothstep': {
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
        const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
        const anglePath = calculate90DegreePath(sourceX, sourceY, targetX, targetY, direction, sourceOffset, targetOffset);
        
        if (anglePath) {
          edgePath = anglePath;
          labelPos = calculateAngleLabelPositions(sourceX, sourceY, targetX, targetY, direction);
        } else {
          showWarningOnce(direction);
          [edgePath] = getStraightPath({
            sourceX, sourceY, targetX, targetY
          });
          labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
        }
        break;
      }
      default: {
        [edgePath] = getBezierPath({
          sourceX, sourceY, targetX, targetY
        });
        labelPos = calculateStraightLabelPositions(sourceX, sourceY, targetX, targetY);
      }
    }

    setLabelPositions({
      source: labelPos.source,
      target: labelPos.target,
      path: edgePath
    });
  }, [sourceNode, targetNode, data?.edgeType, edges, id, source, target]);

  // Add overlap detection
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

  if (!sourceNode || !targetNode) {
    return null;
  }

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={labelPositions.path}
        style={style}
      />
      {data?.showLabels && (
        <EdgeLabelRenderer>
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
