// Import necessary React hooks and React Flow types
import { memo, useEffect, useCallback, useMemo } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';

// Import custom types and utilities
import { DeviceNodeData } from '../../types/device';
import { logger } from '../../utils/logger';
import './NetworkNode.css';

/**
 * Calculates the positioning style for node handles based on their position and index
 * 
 * @param position - The side of the node where the handle should be placed (Top, Right, Bottom, Left)
 * @param index - The index of the handle in its position group
 * @param total - Total number of handles in the same position group
 * @returns A CSS properties object defining the handle's position and style
 * 
 * This function ensures handles are evenly distributed along the node's edges
 * Handles are initially hidden (opacity: 0) and can be made visible when selected
 */
const getHandleStyle = (position: Position, index: number, total: number) => {
  // Base style for all handles - positioned absolutely and initially hidden
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    opacity: 0, // Hide handles by default
  };

  // Calculate percentage position along the edge to distribute handles evenly
  const percentage = ((index + 1) / (total + 1)) * 100;

  // Adjust handle position based on the node side
  switch (position) {
    case Position.Top:
      return {
        ...baseStyle,
        top: '-8px',     // Position slightly outside the top of the node
        left: `${percentage}%`,  // Distribute horizontally
      };
    case Position.Right:
      return {
        ...baseStyle,
        right: '-8px',   // Position slightly outside the right of the node
        top: `${percentage}%`,   // Distribute vertically
      };
    case Position.Bottom:
      return {
        ...baseStyle,
        bottom: '-8px',  // Position slightly outside the bottom of the node
        left: `${percentage}%`,  // Distribute horizontally
      };
    case Position.Left:
      return {
        ...baseStyle,
        left: '-8px',    // Position slightly outside the left of the node
        top: `${percentage}%`,   // Distribute vertically
      };
    default:
      return baseStyle;
  }
};

/**
 * NetworkNode Component: Renders a network device node with dynamic handles
 * 
 * @param props - Node properties including device data and ID
 * @returns A React component representing a network device in the topology
 * 
 * Features:
 * - Renders device icon
 * - Creates handles for network interfaces
 * - Supports dynamic handle positioning and selection
 * - Logs debug information about node handles
 */
const NetworkNode = ({ data, id }: NodeProps<DeviceNodeData>) => {
  // Extract handles from node data, defaulting to an empty object if not provided
  const handles = data.handles || {};

  // Find the ID of the currently selected handle based on the selected interface
  const selectedHandleId = Object.entries(handles).find(
    ([_, handle]) => handle.interface.interfaceName === data.selectedInterface
  )?.[0];

  // Group handles by their position (Top, Right, Bottom, Left)
  // This helps in organizing and rendering handles systematically
  const handlesByPosition = Object.entries(handles).reduce((acc, [handleId, handle]) => {
    const position = handle.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push({ id: handleId, ...handle });
    return acc;
  }, {} as Record<Position, Array<{ id: string; position: Position; interface: any }>>);

  // Debug logging for node handles
  // Helps in tracking node configuration and selected interfaces during development
  useEffect(() => {
    logger.debug('Device node handles', {
      id,
      deviceName: data.config.deviceName,
      selectedInterface: data.selectedInterface,
      handles: Object.keys(handles).map(key => ({
        id: key,
        position: handles[key].position,
        type: handles[key].interface.interfaceType
      }))
    });
  }, [id, handles, data]);

  return (
    <div className="network-node">
      {/* Render device icon if an icon path is provided */}
      {data.iconPath && (
        <img 
          src={data.iconPath} 
          alt={data.config.deviceName}
          className="device-icon"
        />
      )}
      
      {/* Dynamically render handles for each position */}
      {Object.entries(handlesByPosition).map(([position, positionHandles]) => (
        positionHandles.map((handle, index) => {
          // Calculate handle style based on position and index
          const style = getHandleStyle(handle.position as Position, index, positionHandles.length);
          
          // Determine if this handle is the currently selected one
          const isSelected = handle.id === selectedHandleId;
          
          return (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={handle.position}
              style={{
                ...style,
                opacity: isSelected ? 1 : 0,  // Show/hide handle based on selection
              }}
              className="device-handle"
              isConnectable={true}
              // Provide a tooltip with interface details
              title={`${handle.interface.interfaceName} (${handle.interface.interfaceType})`}
              // Add data attribute for potential additional interactions
              data-interface={handle.interface.interfaceName}
            />
          );
        })
      ))}
    </div>
  );
};

// Export the component wrapped in memo for performance optimization
// This prevents unnecessary re-renders if props haven't changed
export default memo(NetworkNode);
