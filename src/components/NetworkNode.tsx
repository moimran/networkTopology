import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import './NetworkNode.css';

interface HandleData {
  type: 'source';
  position: Position;
}

interface NodeData {
  label?: string;
  handles: Record<string, HandleData>;
}

const NetworkNode = ({ data, id }: NodeProps<NodeData>) => {
  // Initialize handles if not present
  const handles = data.handles || {
    right: { type: 'source', position: Position.Right },
    bottom: { type: 'source', position: Position.Bottom },
  };

  return (
    <div className="network-node">
      {Object.entries(handles).map(([handleId, handle]) => (
        <Handle
          key={handleId}
          id={handleId}
          type={handle.type}
          position={handle.position}
          className="handle source-handle"
          isConnectable={true}
        />
      ))}
      <div className="label">{data.label || `Node ${id}`}</div>
    </div>
  );
};

export default memo(NetworkNode);
