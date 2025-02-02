import { memo, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals, Connection } from '@xyflow/react';
import './NetworkNode.css';

interface HandleData {
  type: 'source' | 'target';
  position: Position;
}

interface NodeData {
  label?: string;
  handles: Record<string, HandleData>;
}

const NetworkNode = ({ data, id }: NodeProps<NodeData>) => {
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Initialize handles if not present
  const handles = data.handles || {
    right: { type: 'source', position: Position.Right },
    bottom: { type: 'source', position: Position.Bottom },
  };

  // Log when node data changes
  useEffect(() => {
    console.log(' Node data changed:', id, {
      data,
      handles: data.handles
    });
  }, [id, data]);

  // Update node internals when handles change
  useEffect(() => {
    console.log(' Updating node internals:', id, data.handles);
    updateNodeInternals(id);
  }, [id, data.handles, updateNodeInternals]);

  const onConnectHandler = useCallback((params: Connection) => {
    console.log(' Handle connection attempt:', id, params);
    return true; // Allow the connection
  }, [id]);

  return (
    <div className="network-node">
      {Object.entries(handles).map(([handleId, handle]) => {
        console.log(' Rendering handle:', id, handleId, handle);
        return (
          <Handle
            key={handleId}
            id={handleId}
            type={handle.type}
            position={handle.position}
            className={`handle ${handle.type}-handle`}
            isConnectable={true}
            onConnect={onConnectHandler}
            style={{ backgroundColor: handle.type === 'source' ? '#4CAF50' : '#2196F3' }}
          />
        );
      })}
      <div className="label">{data.label || `Node ${id}`}</div>
    </div>
  );
};

export default memo(NetworkNode);
