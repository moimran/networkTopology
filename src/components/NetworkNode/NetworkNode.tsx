import { memo, useEffect } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { NetworkNodeData } from '../../types/network';
import { DeviceNodeData } from '../../types/device';
import { logger } from '../../utils/logger';
import '../../styles/components/networkNode.css';

type NodeData = NetworkNodeData | DeviceNodeData;

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
 * A customizable node component for the network topology graph.
 * Supports both basic network nodes and device-configured nodes.
 */
const NetworkNode = ({ data, id }: NodeProps<NodeData>) => {
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

  // Check if this is a device node
  const isDeviceNode = 'config' in data;
  
  useEffect(() => {
    if (isDeviceNode) {
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
    }
  }, [id, isDeviceNode, handles, data]);

  logger.debug('Rendering network node', { 
    id, 
    isDeviceNode, 
    handles,
    interfaceCount: isDeviceNode ? Object.keys(handles).length : 0,
    config: isDeviceNode ? data.config : undefined 
  });

  return (
    <div className={`network-node ${isDeviceNode ? 'device-node' : ''}`}>
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
              className={`handle ${isDeviceNode ? 'device-handle' : ''}`}
              isConnectable={true}
              title={isDeviceNode ? `${handle.interface.interfaceName} (${handle.interface.interfaceType})` : undefined}
              data-interface={isDeviceNode ? handle.interface.interfaceName : undefined}
              data-type={isDeviceNode ? handle.interface.interfaceType : undefined}
            />
          );
        })
      ))}
      
      {/* Node label */}
      <div className="label">{data.label || `Node ${id}`}</div>
      
      {/* Device info (if device node) */}
      {isDeviceNode && (
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
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(NetworkNode);
