import { memo } from 'react';
import { Handle, NodeProps } from '@xyflow/react';
import { NetworkNodeData } from '../../types/network';
import { logger } from '../../utils/logger';
import '../../styles/components/networkNode.css';

/**
 * NetworkNode Component
 * 
 * A customizable node component for the network topology graph.
 * Supports multiple handles for connections and displays a label.
 */
const NetworkNode = ({ data, id }: NodeProps<NetworkNodeData>) => {
  // Initialize handles if not present
  const handles = data.handles || {};

  logger.debug('Rendering network node', { id, handles });

  return (
    <div className="network-node">
      {/* Render connection handles */}
      {Object.entries(handles).map(([handleId, handle]) => (
        <Handle
          key={handleId}
          id={handleId}
          type={handle.type}
          position={handle.position}
          className="handle"
          isConnectable={true}
        />
      ))}
      
      {/* Node label */}
      <div className="label">{data.label || `Node ${id}`}</div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(NetworkNode);
