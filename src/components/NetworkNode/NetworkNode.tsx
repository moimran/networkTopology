import { memo, useEffect } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { DeviceNodeData } from '../../types/device';
import { logger } from '../../utils/logger';
import '../../styles/components/networkNode.css';

// Calculate handle style based on position and index
const getHandleStyle = (position: Position, index: number, total: number) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
  };

  // Calculate percentage along the edge based on position and number of handles
  const percentage = ((index + 1) / (total + 1)) * 100;

  switch (position) {
    case Position.Top:
      return {
        ...baseStyle,
        top: '-4px',
        left: `${percentage}%`,
      };
    case Position.Right:
      return {
        ...baseStyle,
        right: '-4px',
        top: `${percentage}%`,
      };
    case Position.Bottom:
      return {
        ...baseStyle,
        bottom: '-4px',
        left: `${percentage}%`,
      };
    case Position.Left:
      return {
        ...baseStyle,
        left: '-4px',
        top: `${percentage}%`,
      };
    default:
      return baseStyle;
  }
};

/**
 * NetworkNode Component
 * 
 * A node component for the network topology graph that displays device information
 * and handles based on the device configuration.
 */
const NetworkNode = ({ data, id }: NodeProps<DeviceNodeData>) => {
  // Initialize handles
  const handles = data.handles || {};
  const handleCount = Object.keys(handles).length;

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
      handleCount,
      handles: Object.keys(handles).map(key => ({
        id: key,
        position: handles[key].position,
        type: handles[key].interface.interfaceType
      }))
    });
  }, [id, handles, data]);

  logger.debug('Rendering network node', { 
    id, 
    handles,
    interfaceCount: Object.keys(handles).length,
    config: data.config 
  });

  return (
    <div className="device-node">
      {/* Render handles grouped by position */}
      {Object.entries(handlesByPosition).map(([position, positionHandles]) => (
        positionHandles.map((handle, index) => {
          const style = getHandleStyle(handle.position as Position, index, positionHandles.length);
          
          return (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={handle.position}
              style={style}
              className="device-handle"
              isConnectable={true}
              title={`${handle.interface.interfaceName} (${handle.interface.interfaceType})`}
              data-interface={handle.interface.interfaceName}
              data-type={handle.interface.interfaceType}
            />
          );
        })
      ))}
      
      {/* Node label */}
      <div className="label">{data.label || data.config.deviceName}</div>
      
      {/* Device info */}
      <div className="device-info">
        <div className="device-type">{data.config.deviceType}</div>
        <div className="interface-count">
          Interfaces: {data.config.interfaces.length}
        </div>
        <div className="interface-list">
          {data.config.interfaces.map((iface) => (
            <div key={iface.interfaceName} className="interface-item">
              <span className="interface-name">{iface.interfaceName}</span>
              <span className="interface-type">({iface.interfaceType})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(NetworkNode);
