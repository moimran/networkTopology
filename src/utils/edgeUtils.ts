import { Position, XYPosition, InternalNode } from '@xyflow/react';

/**
 * Get the center coordinates of a node
 */
function getNodeCenter(node: InternalNode): XYPosition {
  const { width = 0, height = 0 } = node.measured ?? {};
  return {
    x: node.internals.positionAbsolute.x + width / 2,
    y: node.internals.positionAbsolute.y + height / 2
  };
}

/**
 * Determine edge position based on angle between centers
 */
function getEdgePosition(source: XYPosition, target: XYPosition): Position {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= 135 || angle < -135) return Position.Left;
  return Position.Top;
}

/**
 * Get edge parameters for drawing the floating edge from node centers
 */
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  // Get center points of both nodes
  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);

  // Calculate positions based on the angle between centers
  const sourcePos = getEdgePosition(sourceCenter, targetCenter);
  const targetPos = getEdgePosition(targetCenter, sourceCenter);

  return {
    sx: sourceCenter.x,
    sy: sourceCenter.y,
    tx: targetCenter.x,
    ty: targetCenter.y,
    sourcePos,
    targetPos,
  };
}
