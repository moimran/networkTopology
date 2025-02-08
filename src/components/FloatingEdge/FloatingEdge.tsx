import { EdgeProps, useStore, getBezierPath, getStraightPath, getSmoothStepPath, Position } from '@xyflow/react';
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

  const defaultStyle = {
    strokeWidth: .75,  // Thinner line
    ...style
  };

  // Calculate label positions near the nodes
  const getSourceLabelPosition = () => {
    const distance = 40; // Distance from node
    const angle = Math.atan2(ty - sy, tx - sx);
    return {
      x: sx + Math.cos(angle) * distance,
      y: sy + Math.sin(angle) * distance
    };
  };

  const getTargetLabelPosition = () => {
    const distance = 40; // Distance from node
    const angle = Math.atan2(ty - sy, tx - sx);
    return {
      x: tx - Math.cos(angle) * distance,
      y: ty - Math.sin(angle) * distance
    };
  };

  const sourceLabelPos = getSourceLabelPosition();
  const targetLabelPos = getTargetLabelPosition();
  // Use interface labels if available, fall back to interface names
  const sourceText = data?.sourceInterfaceLabel || data?.sourceInterface || 'E1/1';
  const targetText = data?.targetInterfaceLabel || data?.targetInterface || 'E1/1';

  return (
    <>
      {/* Edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...defaultStyle,
          zIndex: 1
        }}
      />
      {data?.showLabels && (
        <>
          {/* Source Label */}
          <g transform={`translate(${sourceLabelPos.x}, ${sourceLabelPos.y})`}>
            <foreignObject
              width={26}
              height={12}
              x={-16}
              y={-7}
              className="edgebutton-foreignobject"
              requiredExtensions="http://www.w3.org/1999/xhtml"
            >
              <div className="floating-edge-label">
                {sourceText}
              </div>
            </foreignObject>
          </g>
          {/* Target Label */}
          <g transform={`translate(${targetLabelPos.x}, ${targetLabelPos.y})`}>
            <foreignObject
              width={26}
              height={12}
              x={-16}
              y={-7}
              className="edgebutton-foreignobject"
              requiredExtensions="http://www.w3.org/1999/xhtml"
            >
              <div className="floating-edge-label">
                {targetText}
              </div>
            </foreignObject>
          </g>
        </>
      )}
    </>
  );
}

export default FloatingEdge;
