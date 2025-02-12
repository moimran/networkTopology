import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../../utils/edgeUtils';
import { useRef, useCallback, useState, memo } from 'react';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
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

function FloatingEdge({ id, source, target, style, data, selected }: EdgeProps<FloatingEdgeData>) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Fix: Use nodeLookup instead of nodeInternals
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

  // Get the appropriate path based on edge type
  let edgePath = '';
  let [sourceX, sourceY] = [sx + sourceOffset.x, sy + sourceOffset.y];
  let [targetX, targetY] = [tx + targetOffset.x, ty + targetOffset.y];

  // Calculate label positions at a fixed distance from nodes
  const LABEL_DISTANCE = 40; // pixels from node
  let sourceLabelX = 0, sourceLabelY = 0;
  let targetLabelX = 0, targetLabelY = 0;

  const pathParams = {
    sourceX,
    sourceY,
    targetX,
    targetY,
  };

  // Apply edge type-specific path generation
  switch (data?.edgeType || 'straight') {
    case 'straight': {
      [edgePath] = getStraightPath(pathParams);
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
        ...pathParams,
        borderRadius,
      });
      // For step edges, position labels based on vertical distance
      const middlePoint = (targetY - sourceY) / 2;
      const isConjusted = middlePoint < LABEL_DISTANCE + 15;

      console.log({ isConjusted });
      const delta = isConjusted ? middlePoint : LABEL_DISTANCE;

      const isOpposite = targetY - sourceY < 20;

      sourceLabelX = sourceX;
      sourceLabelY = sourceY + (isOpposite ? 20 : delta);
      targetLabelX = targetX;
      targetLabelY = targetY - (isOpposite ? 20 : delta);
      break;
    }
    case 'bezier': {
      [edgePath] = getBezierPath(pathParams);
      // For bezier curves, use the same approach as straight lines
      const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
      sourceLabelX = sourceX + Math.cos(angle) * LABEL_DISTANCE;
      sourceLabelY = sourceY + Math.sin(angle) * LABEL_DISTANCE;
      targetLabelX = targetX - Math.cos(angle) * LABEL_DISTANCE;
      targetLabelY = targetY - Math.sin(angle) * LABEL_DISTANCE;
      break;
    }
    default: {
      // Default to straight
      [edgePath] = getStraightPath(pathParams);
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

  // Add visual feedback for selected and hover states
  const edgeClasses = [
    'react-flow__edge-path',
    selected ? 'selected-edge' : '',
    isHovered ? 'edge-hover' : ''
  ].filter(Boolean).join(' ');

  // Use interface labels if available, fall back to interface names
  const sourceText = data?.sourceInterfaceLabel || data?.sourceInterface || 'E1/1';
  const targetText = data?.targetInterfaceLabel || data?.targetInterface || 'E1/1';

  const labelStyle = {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    fontSize: '9px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '1px 4px',  
    borderRadius: '12px', 
    pointerEvents: 'all',
    background: '#e6f3ff', 
    color: '#333', 
    border: '2px solid #2196f3', 
  } as const;

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 1000 : 0 }}
    >
      <path
        id={id}
        className={edgeClasses}
        d={edgePath}
        style={defaultStyle}
      />
      {(data?.showLabels || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              ...labelStyle,
              left: sourceLabelX,
              top: sourceLabelY,
              zIndex: isHovered ? 1000 : 0,
              filter: isHovered ? 'drop-shadow(0 0 2px rgba(0,0,0,0.2))' : 'none',
            }}
            className="nodrag nopan interface-label"
          >
            {sourceText}
          </div>
          <div
            style={{
              ...labelStyle,
              left: targetLabelX,
              top: targetLabelY,
              zIndex: isHovered ? 1000 : 0,
              filter: isHovered ? 'drop-shadow(0 0 2px rgba(0,0,0,0.2))' : 'none',
            }}
            className="nodrag nopan interface-label"
          >
            {targetText}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

export default memo(FloatingEdge);
