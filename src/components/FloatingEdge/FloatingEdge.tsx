import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, EdgeLabelRenderer, useEdges } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback, memo, useLayoutEffect, useState, useMemo } from 'react';
import {
  calculate90DegreePath,
  calculateParallelOffset,
  calculate90DegreeOffset,
  calculateStraightLabelPositions,
  calculateStepLabelPositions,
  calculateAngleLabelPositions,
  detectOverlappingEdges,
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
 * A specialized edge component that supports multiple edge types and automatic label positioning.
 */
const FloatingEdge = memo(({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) => {
  // State to store calculated positions for edge path and labels
  const [labelPositions, setLabelPositions] = useState<EdgePositions>({
    source: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    path: ''
  });

  // Custom selector to only get the nodes and relevant edges
  const { sourceNode, targetNode, relevantEdges } = useStore(
    useCallback((store) => {
      const sourceNode = store.nodeLookup.get(source);
      const targetNode = store.nodeLookup.get(target);
      
      // Only get edges that share our source node
      const relevantEdges = store.edges.filter(edge => 
        edge.source === source || edge.target === source
      );

      return {
        sourceNode,
        targetNode,
        relevantEdges
      };
    }, [source, target]),
    useCallback((prev, next) => {
      // Deep comparison of node positions
      const sourceEqual = 
        prev.sourceNode?.position.x === next.sourceNode?.position.x &&
        prev.sourceNode?.position.y === next.sourceNode?.position.y;
      const targetEqual = 
        prev.targetNode?.position.x === next.targetNode?.position.x &&
        prev.targetNode?.position.y === next.targetNode?.position.y;
      
      // Compare only relevant edges
      const edgesEqual = prev.relevantEdges.length === next.relevantEdges.length &&
        prev.relevantEdges.every((edge, i) => edge.id === next.relevantEdges[i].id);
      
      return sourceEqual && targetEqual && edgesEqual;
    }, [])
  );

  // Get all edges and filter connections
  const edges = useEdges();
  const getNodeConnections = useCallback((nodeId: string) => {
    return edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
  }, [edges]);

  // Memoize connections to prevent unnecessary recalculations
  const sourceConnections = useMemo(() => getNodeConnections(source), [getNodeConnections, source]);
  const targetConnections = useMemo(() => getNodeConnections(target), [getNodeConnections, target]);

  // Memoize edge parameters to prevent unnecessary recalculations
  const edgeParams = useMemo(() => {
    if (!sourceNode || !targetNode) return null;
    return getEdgeParams(sourceNode, targetNode);
  }, [sourceNode?.position, targetNode?.position]);

  // Memoize offset calculations
  const offsets = useMemo(() => {
    if (!sourceNode || !targetNode || !edgeParams) return null;
    
    if (data?.edgeType?.startsWith('angle-')) {
      const direction = data.edgeType.split('-')[1] as 'right' | 'left' | 'top' | 'bottom';
      return calculate90DegreeOffset(sourceNode, targetNode, id, relevantEdges, direction);
    }
    return calculateParallelOffset(sourceNode, targetNode, id, relevantEdges);
  }, [sourceNode, targetNode, id, relevantEdges, data?.edgeType, edgeParams]);

  // Warning tracking
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

  // Calculate edge path and label positions
  useLayoutEffect(() => {
    if (!sourceNode || !targetNode || !edgeParams || !offsets) return;

    const { sx, sy, tx, ty } = edgeParams;
    const { sourceOffset, targetOffset } = offsets;

    // Apply offsets
    const sourceX = sx + sourceOffset.x;
    const sourceY = sy + sourceOffset.y;
    const targetX = tx + targetOffset.x;
    const targetY = ty + targetOffset.y;

    let edgePath = '';
    let labelPos;

    // Calculate path based on edge type
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
  }, [sourceNode?.position, targetNode?.position, data?.edgeType, offsets, showWarningOnce]);

  // Detect and log edge overlaps for debugging
  useLayoutEffect(() => {
    if (!sourceNode || !targetNode) return;

    // Check for overlaps at source node using filtered source connections
    const sourceOverlaps = detectOverlappingEdges(source, id, data?.edgeType, sourceConnections);
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

    // Check for overlaps at target node using filtered target connections
    const targetOverlaps = detectOverlappingEdges(target, id, data?.edgeType, targetConnections);
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
  }, [id, source, target, data?.edgeType, sourceNode, targetNode, sourceConnections, targetConnections]);

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
