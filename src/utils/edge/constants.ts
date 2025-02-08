/**
 * Constants for edge styling and calculations
 */

// Label positioning
export const LABEL_DISTANCE = 40;
export const MIN_LABEL_DISTANCE = 20;

// Edge spacing
export const MIN_EDGE_SPACING = 2;
export const MAX_EDGE_SPACING = 8;

// Angle calculations
export const MIN_ANGLE_DISTANCE = 20;

// Debug settings
export const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

// Default label style
export const DEFAULT_LABEL_STYLE = {
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
