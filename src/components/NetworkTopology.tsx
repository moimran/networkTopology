import { useState, DragEvent, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  ReactFlowInstance,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Controls,
  NodeOrigin,
  Position,
  ConnectionMode,
} from '@xyflow/react';

import Sidebar from './Sidebar';
import NetworkNode from './NetworkNode';
import './NetworkTopology.css';

// Custom node types
const nodeTypes = {
  networkNode: NetworkNode,
};

const initialNodes: Node[] = [];
const nodeOrigin: NodeOrigin = [0.5, 0.5];

let id = 0;
const getId = () => `network_node_${id++}`;

const NetworkTopology = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Handle new connections between nodes
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  // Initialize ReactFlow instance
  const onInit = useCallback((rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  }, []);

  // Handle drag over event for node creation
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node creation on drop
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: 'networkNode',
        position,
        data: { 
          label: `Network Node ${id}`,
          handles: {
            right: { type: 'source', position: Position.Right },
            bottom: { type: 'source', position: Position.Bottom },
          }
        },
      };

      setNodes((nds) => nds.concat(newNode));
    }
  }, [reactFlowInstance, setNodes]);

  return (
    <div className="network-topology">
      <ReactFlowProvider>
        <div className="network-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            nodeOrigin={nodeOrigin}
            connectionMode={ConnectionMode.Loose}
            fitView
            defaultEdgeOptions={{
              type: 'default',
              animated: true
            }}
          >
            <Controls />
          </ReactFlow>
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
};

export default NetworkTopology;
