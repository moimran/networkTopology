import { Position, XYPosition, InternalNode } from '@xyflow/react';

/**
 * Calculate the intersection point between two nodes
 */
function getNodeIntersection(node: InternalNode, target: InternalNode): XYPosition {
  const { width = 0, height = 0 } = node.measured ?? {};
  const centerX = node.internals.positionAbsolute.x + width / 2;
  const centerY = node.internals.positionAbsolute.y + height / 2;
  const targetCenterX = target.internals.positionAbsolute.x + (target.measured?.width ?? 0) / 2;
  const targetCenterY = target.internals.positionAbsolute.y + (target.measured?.height ?? 0) / 2;

  // Calculate angle between centers
  const dx = targetCenterX - centerX;
  const dy = targetCenterY - centerY;
  const angle = Math.atan2(dy, dx);

  // Calculate intersection with node boundary
  const intersectionX = centerX + Math.cos(angle) * width / 2;
  const intersectionY = centerY + Math.sin(angle) * height / 2;

  return { x: intersectionX, y: intersectionY };
}

/**
 * Determine the edge position based on intersection point
 */
function getEdgePosition(node: InternalNode, intersectionPoint: XYPosition): Position {
  const centerX = node.internals.positionAbsolute.x + (node.measured?.width ?? 0) / 2;
  const centerY = node.internals.positionAbsolute.y + (node.measured?.height ?? 0) / 2;
  
  const dx = intersectionPoint.x - centerX;
  const dy = intersectionPoint.y - centerY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -45 && angle < 45) return Position.Right;
  if (angle >= 45 && angle < 135) return Position.Bottom;
  if (angle >= 135 || angle < -135) return Position.Left;
  return Position.Top;
}

/**
 * Get edge parameters for drawing the floating edge
 */
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersection = getNodeIntersection(source, target);
  const targetIntersection = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersection);
  const targetPos = getEdgePosition(target, targetIntersection);

  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourcePos,
    targetPos,
  };
}
