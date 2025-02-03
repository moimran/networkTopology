import { useState, DragEvent, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
  ConnectionMode,
  NodeOrigin,
  Controls,
} from '@xyflow/react';

import { useNetworkNodes } from '../hooks/useNetworkNodes';
import { useNetworkEdges } from '../hooks/useNetworkEdges';
import { logger } from '../utils/logger';
import NetworkNode from './NetworkNode/NetworkNode';
import Sidebar from './Sidebar';
import '../styles/components/networkTopology.css';

/**
 * Custom node types configuration
 */
const nodeTypes = {
  networkNode: NetworkNode,
};

/**
 * Default node origin for consistent positioning
 */
const nodeOrigin: NodeOrigin = [0.5, 0.5];

/**
 * NetworkTopology Component
 * 
 * Main component for the network topology visualization.
 * Handles node creation, connection management, and graph visualization.
 */
const NetworkTopology = () => {
  // ReactFlow instance state
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  
  // Custom hooks for managing nodes and edges
  const { nodes, onNodesChange, createNode } = useNetworkNodes();
  const { edges, onEdgesChange, onConnect } = useNetworkEdges();

  /**
   * Initialize ReactFlow instance
   */
  const onInit = useCallback((instance: ReactFlowInstance) => {
    logger.debug('Initializing ReactFlow instance');
    setReactFlowInstance(instance);
  }, []);

  /**
   * Handle drag over event for node creation
   */
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle node creation on drop
   */
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      createNode(position);
    }
  }, [reactFlowInstance, createNode]);

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
