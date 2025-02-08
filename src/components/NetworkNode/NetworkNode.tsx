import { memo, useEffect, useCallback, useMemo } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { DeviceNodeData } from '../../types/device';
import { logger } from '../../utils/logger';
import './NetworkNode.css';

// Calculate handle style based on position and index
const getHandleStyle = (position: Position, index: number, total: number) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    opacity: 0, // Hide handles by default
  };

  // Calculate percentage along the edge based on position and number of handles
  const percentage = ((index + 1) / (total + 1)) * 100;

  switch (position) {
    case Position.Top:
      return {
        ...baseStyle,
        top: '-8px',
        left: `${percentage}%`,
      };
    case Position.Right:
      return {
        ...baseStyle,
        right: '-8px',
        top: `${percentage}%`,
      };
    case Position.Bottom:
      return {
        ...baseStyle,
        bottom: '-8px',
        left: `${percentage}%`,
      };
    case Position.Left:
      return {
        ...baseStyle,
        left: '-8px',
        top: `${percentage}%`,
      };
    default:
      return baseStyle;
  }
};

const NetworkNode = ({ data, id }: NodeProps<DeviceNodeData>) => {
  const handles = data.handles || {};

  // Get the selected handle ID based on the selected interface name
  const selectedHandleId = Object.entries(handles).find(
    ([_, handle]) => handle.interface.interfaceName === data.selectedInterface
  )?.[0];

  // Group handles by position
  const handlesByPosition = Object.entries(handles).reduce((acc, [handleId, handle]) => {
    const position = handle.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push({ id: handleId, ...handle });
    return acc;
  }, {} as Record<Position, Array<{ id: string; position: Position; interface: any }>>);

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
    <div 
      className="network-node"
    >
      {/* Handles */}
      {Object.entries(handlesByPosition).map(([position, positionHandles]) => (
        positionHandles.map((handle, index) => {
          const style = getHandleStyle(handle.position as Position, index, positionHandles.length);
          const isSelected = handle.id === selectedHandleId;
          
          return (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={handle.position}
              style={{
                ...style,
                opacity: isSelected ? 1 : 0,
              }}
              className="device-handle"
              isConnectable={true}
              title={`${handle.interface.interfaceName} (${handle.interface.interfaceType})`}
              data-interface={handle.interface.interfaceName}
              data-type={handle.interface.interfaceType}
            />
          );
        })
      ))}
      
      {/* Icon and Label */}
      <img 
        src="/icons/router-2d-gen-dark-s.svg"
        alt={data.config.deviceName}
        className="device-icon"
      />
      <div className="node-label">{data.label || data.config.deviceName}</div>
    </div>
  );
};

export default memo(NetworkNode);
