import { EdgeDirection } from '../types/edge.types';
import { LABEL_DISTANCE, MIN_LABEL_DISTANCE } from './constants';

/**
 * Calculate label positions for straight edges
 */
export function calculateStraightLabelPositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
) {
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  return {
    source: {
      x: sourceX + Math.cos(angle) * LABEL_DISTANCE,
      y: sourceY + Math.sin(angle) * LABEL_DISTANCE,
    },
    target: {
      x: targetX - Math.cos(angle) * LABEL_DISTANCE,
      y: targetY - Math.sin(angle) * LABEL_DISTANCE,
    },
  };
}

/**
 * Calculate label positions for step edges
 */
export function calculateStepLabelPositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
) {
  const middlePoint = (targetY - sourceY) / 2;
  const isConjusted = middlePoint < LABEL_DISTANCE + 15;
  const delta = isConjusted ? middlePoint : LABEL_DISTANCE;
  const isOpposite = targetY - sourceY < MIN_LABEL_DISTANCE;

  return {
    source: {
      x: sourceX,
      y: sourceY + (isOpposite ? MIN_LABEL_DISTANCE : delta),
    },
    target: {
      x: targetX,
      y: targetY - (isOpposite ? MIN_LABEL_DISTANCE : delta),
    },
  };
}

/**
 * Calculate label positions for angle edges
 */
export function calculateAngleLabelPositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  direction: EdgeDirection
) {
  const isSourceLeftOfTarget = sourceX < targetX;
  const isSourceAboveTarget = sourceY < targetY;

  switch (direction) {
    case 'right':
      if (isSourceLeftOfTarget) {
        return {
          source: { x: sourceX + LABEL_DISTANCE, y: sourceY },
          target: { x: targetX, y: targetY + (isSourceAboveTarget ? -LABEL_DISTANCE : LABEL_DISTANCE) },
        };
      } else {
        return {
          source: { x: sourceX - LABEL_DISTANCE, y: sourceY },
          target: { x: targetX, y: targetY + (isSourceAboveTarget ? -LABEL_DISTANCE : LABEL_DISTANCE) },
        };
      }
    case 'left':
      if (isSourceLeftOfTarget) {
        return {
          source: { x: sourceX + LABEL_DISTANCE, y: sourceY },
          target: { x: targetX, y: targetY + (isSourceAboveTarget ? -LABEL_DISTANCE : LABEL_DISTANCE) },
        };
      } else {
        return {
          source: { x: sourceX - LABEL_DISTANCE, y: sourceY },
          target: { x: targetX, y: targetY + (isSourceAboveTarget ? -LABEL_DISTANCE : LABEL_DISTANCE) },
        };
      }
    case 'top':
      console.log(isSourceAboveTarget)
      if (isSourceAboveTarget) {
        return {
          source: { x: sourceX, y: sourceY - LABEL_DISTANCE },
          target: { x: targetX + (isSourceLeftOfTarget ? -LABEL_DISTANCE : LABEL_DISTANCE), y: targetY },
        };
      } else {
        return {
          source: { x: sourceX, y: sourceY + LABEL_DISTANCE -80},
          target: { x: targetX + (isSourceLeftOfTarget ? -LABEL_DISTANCE : LABEL_DISTANCE), y: targetY },
        };
      }
    case 'bottom':
      if (isSourceAboveTarget) {
        return {
          source: { x: sourceX, y: sourceY + LABEL_DISTANCE },
          target: { x: targetX + (isSourceLeftOfTarget ? -LABEL_DISTANCE : LABEL_DISTANCE), y: targetY },
        };
      } else {
        return {
          source: { x: sourceX, y: sourceY - LABEL_DISTANCE },
          target: { x: targetX + (isSourceLeftOfTarget ? -LABEL_DISTANCE : LABEL_DISTANCE), y: targetY },
        };
      }
  }
}
