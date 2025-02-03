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
  OnConnectStart,
  OnConnectEnd,
  ConnectStart,
} from '@xyflow/react';

import Sidebar from './Sidebar';
import NetworkNode from './NetworkNode';
import './NetworkTopology.css';

// Define custom node types
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
  const [connectionStartHandle, setConnectionStartHandle] = useState<{ nodeId: string, handleId: string } | null>(null);

  // Helper function to update handle types
  const updateNodeHandles = useCallback((nodeId: string, handleId: string, type: 'source' | 'target') => {
    console.log('🔄 Updating handle:', { nodeId, handleId, type });
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          console.log('📍 Found node to update:', node.id);
          
          const currentHandles = node.data.handles || {};
          const updatedHandles = {
            ...currentHandles,
            [handleId]: {
              ...currentHandles[handleId],
              type,
              position: currentHandles[handleId]?.position || Position.Right
            }
          };
          
          return {
            ...node,
            data: {
              ...node.data,
              handles: updatedHandles
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onConnectStart: OnConnectStart = useCallback((event: any, { nodeId, handleId }) => {
    console.log('🎯 Connection start:', { nodeId, handleId });
    setConnectionStartHandle({ nodeId, handleId });
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    console.log('🔚 Connection end');
    setConnectionStartHandle(null);
  }, []);

  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectionStartHandle && connectionStartHandle.nodeId !== node.id) {
      console.log('🎯 Node mouse enter during connection:', node.id);
      // Update all handles of the target node to be of type 'target'
      const nodeData = node.data;
      if (nodeData.handles) {
        Object.keys(nodeData.handles).forEach(handleId => {
          updateNodeHandles(node.id, handleId, 'target');
        });
      }
    }
  }, [connectionStartHandle, updateNodeHandles]);

  const onNodeMouseLeave = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectionStartHandle && connectionStartHandle.nodeId !== node.id) {
      console.log('🎯 Node mouse leave during connection:', node.id);
      // Reset handles back to source type when mouse leaves
      const nodeData = node.data;
      if (nodeData.handles) {
        Object.keys(nodeData.handles).forEach(handleId => {
          updateNodeHandles(node.id, handleId, 'source');
        });
      }
    }
  }, [connectionStartHandle, updateNodeHandles]);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    console.log('🔌 New connection:', connection);
    
    setEdges((eds) => {
      console.log('Adding edge:', connection);
      return addEdge(connection, eds);
    });

    // Get the actual handles involved in the connection
    const sourceHandle = connection.sourceHandle || 'right';
    const targetHandle = connection.targetHandle || 'right';
    
    // Update source node's handle
    if (connection.source) {
      console.log('🎯 Updating source node:', connection.source);
      updateNodeHandles(connection.source, sourceHandle, 'source');
    }

    // Update target node's handle
    if (connection.target) {
      console.log('🎯 Updating target node:', connection.target);
      updateNodeHandles(connection.target, targetHandle, 'target');
    }
  }, [setEdges, updateNodeHandles]);

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    console.log('🚀 Flow initialized');
    setReactFlowInstance(rfi);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const type = event.dataTransfer.getData('application/networknode');
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log('📦 Creating new node');
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
      
      console.log('✨ New node data:', newNode.data);
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
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
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
