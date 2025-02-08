import { Position, XYPosition, Node, InternalNode } from '@xyflow/react';

export function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode): XYPosition {
  const { internals: intersectionInternals } = intersectionNode;
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } = intersectionNode.measured ?? {
    width: 0,
    height: 0,
  };
  const targetPosition = targetNode.internals.positionAbsolute;

  // For circular nodes, we use the radius
  const radius = (intersectionNodeWidth ?? 0) / 2;
  
  // Calculate center points
  const sourceX = intersectionInternals.positionAbsolute.x + radius;
  const sourceY = intersectionInternals.positionAbsolute.y + radius;
  const targetX = targetPosition.x + radius;
  const targetY = targetPosition.y + radius;

  // Calculate the angle between the centers
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);

  // Calculate intersection point on the circle
  const intersectionX = sourceX + Math.cos(angle) * radius;
  const intersectionY = sourceY + Math.sin(angle) * radius;

  console.log('Node intersection calculation:', {
    nodeId: intersectionNode.id,
    center: { x: sourceX, y: sourceY },
    targetCenter: { x: targetX, y: targetY },
    radius,
    angle: angle * (180 / Math.PI),
    intersection: { x: intersectionX, y: intersectionY }
  });

  return {
    x: intersectionX,
    y: intersectionY,
  };
}

export function getEdgePosition(node: Node, intersectionPoint: XYPosition) {
  const n = { ...node.position, ...node };
  const radius = (n.measured?.width ?? 0) / 2;
  const centerX = n.x + radius;
  const centerY = n.y + radius;
  
  // Calculate angle from center to intersection point
  const dx = intersectionPoint.x - centerX;
  const dy = intersectionPoint.y - centerY;
  
  // For nearly vertical alignments, force top/bottom positions
  if (Math.abs(dx) < 10) {
    return dy > 0 ? Position.Bottom : Position.Top;
  }
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine position based on angle
  if (angle >= -45 && angle < 45) {
    return Position.Right;
  } else if (angle >= 45 && angle < 135) {
    return Position.Bottom;
  } else if (angle >= -135 && angle < -45) {
    return Position.Top;
  } else {
    return Position.Left;
  }
}

export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
