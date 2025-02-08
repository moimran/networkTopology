import { EdgeDirection, EdgeOffset } from '../types/edge.types';
import { MIN_ANGLE_DISTANCE } from './constants';

/**
 * Calculate if a 90-degree angle is possible based on node positions
 */
export function canCreate90DegreeAngle(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  direction: EdgeDirection
): boolean {
  switch (direction) {
    case 'right':
      return targetX > sourceX + MIN_ANGLE_DISTANCE;
    case 'left':
      return targetX < sourceX - MIN_ANGLE_DISTANCE;
    case 'top':
      return targetY < sourceY - MIN_ANGLE_DISTANCE;
    case 'bottom':
      return targetY > sourceY + MIN_ANGLE_DISTANCE;
  }
}

/**
 * Calculate the path for a 90-degree angle
 */
export function calculate90DegreePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  direction: EdgeDirection,
  sourceOffset: EdgeOffset,
  targetOffset: EdgeOffset
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
    case 'right':
    case 'left': {
      // Move horizontally from source, then vertically to target
      path.push(`L ${tx} ${sy}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
    case 'top':
    case 'bottom': {
      // Move vertically from source, then horizontally to target
      path.push(`L ${sx} ${ty}`);
      path.push(`L ${tx} ${ty}`);
      break;
    }
  }

  return path.join(' ');
}
