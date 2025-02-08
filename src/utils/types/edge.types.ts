import { Edge } from '@xyflow/react';

export type EdgeDirection = 'right' | 'left' | 'top' | 'bottom';

export type FloatingEdgeData = {
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'angle-right' | 'angle-left' | 'angle-top' | 'angle-bottom';
  sourceInterface?: string;
  targetInterface?: string;
  sourceInterfaceLabel?: string;
  targetInterfaceLabel?: string;
  showLabels?: boolean;
};

export type EdgeOffset = {
  x: number;
  y: number;
};

export type EdgeOffsets = {
  sourceOffset: EdgeOffset;
  targetOffset: EdgeOffset;
};

export type EdgePositions = {
  source: { x: number; y: number };
  target: { x: number; y: number };
  path: string;
};

export type OverlappingEdges = {
  source: Edge[];
  target: Edge[];
};

export type EdgeOverlapResult = {
  hasOverlap: boolean;
  overlappingEdges: OverlappingEdges;
  counts: {
    source: number;
    target: number;
  };
};
