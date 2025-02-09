import { EdgeDirection, EdgeOffset } from '../types/edge.types';
import { MIN_ANGLE_DISTANCE } from './constants';

/**
 * Determines if a 90-degree angle path can be created between two points based on their positions
 * and the desired direction of the edge.
 * 
 * @param sourceX - X coordinate of the source point
 * @param sourceY - Y coordinate of the source point
 * @param targetX - X coordinate of the target point
 * @param targetY - Y coordinate of the target point
 * @param direction - Desired direction of the edge ('right', 'left', 'top', 'bottom')
 * @returns boolean - true if a 90-degree angle can be created, false otherwise
 * 
 * The function checks if there's enough space between the points to create a proper
 * 90-degree angle. MIN_ANGLE_DISTANCE ensures the angle doesn't look too cramped.
 * 
 * For example:
 * - For 'right' direction: target must be sufficiently to the right of source
 * - For 'left' direction: target must be sufficiently to the left of source
 * - For 'top' direction: target must be sufficiently above source
 * - For 'bottom' direction: target must be sufficiently below source
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
 * Calculates an SVG path string for creating a 90-degree angled edge between two points.
 * 
 * @param sourceX - X coordinate of the source point
 * @param sourceY - Y coordinate of the source point
 * @param targetX - X coordinate of the target point
 * @param targetY - Y coordinate of the target point
 * @param direction - Desired direction of the edge ('right', 'left', 'top', 'bottom')
 * @param sourceOffset - Offset to apply to the source point {x, y}
 * @param targetOffset - Offset to apply to the target point {x, y}
 * @returns string | null - SVG path string if path can be created, null otherwise
 * 
 * The function works as follows:
 * 1. Applies offsets to both source and target points to handle parallel edges
 * 2. Checks if a 90-degree angle is possible using canCreate90DegreeAngle
 * 3. Creates an SVG path with exactly two segments:
 *    - For horizontal directions (right/left):
 *      First segment: Moves horizontally from source
 *      Second segment: Moves vertically to target
 *    - For vertical directions (top/bottom):
 *      First segment: Moves vertically from source
 *      Second segment: Moves horizontally to target
 * 
 * SVG Path Commands Used:
 * - M: Move to (starting point)
 * - L: Line to (draw line to point)
 * 
 * Example path for 'right' direction:
 * "M sourceX sourceY L targetX sourceY L targetX targetY"
 *    │              │                 │
 *    │              │                 └── Draw vertical line to target
 *    │              └── Draw horizontal line to target's x-coordinate
 *    └── Move to source point
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
  // Apply offsets to account for parallel edges, using default of 2 if offset is 0
  const sx = sourceX + (sourceOffset.x || 0);
  const sy = sourceY + (sourceOffset.y || 0);
  const tx = targetX + (targetOffset.x || 0);
  const ty = targetY + (targetOffset.y || 0);

  // Verify that a 90-degree angle is possible with these coordinates
  if (!canCreate90DegreeAngle(sx, sy, tx, ty, direction)) {
    return null;
  }

  // Initialize path array to store SVG path commands
  const path = [];
  
  // Start at the source point
  path.push(`M ${sx} ${sy}`);

  // Calculate the path based on direction
  switch (direction) {
    case 'right':
    case 'left': {
      // For horizontal directions:
      // 1. Move horizontally to target's x-coordinate while staying at source's y-coordinate
      path.push(`L ${tx} ${sy}`);
      // 2. Move vertically to target's y-coordinate
      path.push(`L ${tx} ${ty}`);
      break;
    }
    case 'top':
    case 'bottom': {
      // For vertical directions:
      // 1. Move vertically to target's y-coordinate while staying at source's x-coordinate
      path.push(`L ${sx} ${ty}`);
      // 2. Move horizontally to target's x-coordinate
      path.push(`L ${tx} ${ty}`);
      break;
    }
  }

  // Join path commands with spaces and return
  return path.join(' ');
}
