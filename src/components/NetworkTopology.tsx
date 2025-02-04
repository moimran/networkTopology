import { useState, DragEvent, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
  ConnectionMode,
  NodeOrigin,
  Controls,
  Node,
  NodeChange,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  OnConnectStartParams,
} from '@xyflow/react';

import { useDeviceNodes } from '../hooks/useDeviceNodes';
import { useNetworkEdges } from '../hooks/useNetworkEdges';
import { logger } from '../utils/logger';
import NetworkNode from './NetworkNode/NetworkNode';
import Sidebar from './Sidebar';
import InterfaceContextMenu from './InterfaceContextMenu/InterfaceContextMenu';
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
 * Device configuration path
 */
const DEVICE_CONFIG_PATH = '/deviceconfigs/router-2d-gen-dark-s.json';

/**
 * NetworkTopology Component
 * 
 * Main component for the network topology visualization.
 * Handles device node creation, connection management, and graph visualization.
 */
const NetworkTopology = () => {
  // Reference to the ReactFlow instance
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // ReactFlow instance state
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const [nodes, setNodes] = useState<Node[]>([]);
  
  // Custom hooks for managing nodes and edges
  const { edges, onEdgesChange, onConnect, setEdges } = useNetworkEdges();
  const { createDeviceNode, isLoading, error } = useDeviceNodes(DEVICE_CONFIG_PATH);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
    interfaces: any[];
  }>({
    show: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    interfaces: [],
  });

  // Add connection state
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  const [connectionStartHandle, setConnectionStartHandle] = useState<string | null>(null);

  /**
   * Handle node changes (position, selection, etc.)
   */
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    logger.debug('Nodes changed', { changes });
  }, []);

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
  const onDrop = useCallback(async (event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (reactFlowBounds) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = await createDeviceNode(position);
        if (newNode) {
          logger.debug('Creating new device node', newNode);
          setNodes(nds => [...nds, newNode]);
        }
      }
    }
  }, [reactFlowInstance, createDeviceNode]);

  // Handle node context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    
    logger.debug('Node context menu', { 
      nodeId: node.id, 
      position: { x: event.clientX, y: event.clientY },
      data: node.data 
    });

    setContextMenu({
      show: true,
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      nodeId: node.id,
      interfaces: node.data.config.interfaces,
    });
  }, []);

  // Handle interface selection from context menu
  const onInterfaceSelect = useCallback((interfaceName: string) => {
    logger.debug('Interface selected', { nodeId: contextMenu.nodeId, interfaceName });
    // Show the corresponding handle
    const nodes = reactFlowInstance?.getNodes() || [];
    const updatedNodes = nodes.map(node => {
      if (node.id === contextMenu.nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            selectedInterface: interfaceName,
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    setContextMenu(prev => ({ ...prev, show: false }));
  }, [contextMenu.nodeId, reactFlowInstance, setNodes]);

  // Handle connection start
  const onConnectStart = useCallback((event: React.MouseEvent | React.TouchEvent, { nodeId, handleId }: OnConnectStartParams) => {
    setConnectionStartNode(nodeId || null);
    setConnectionStartHandle(handleId || null);
    logger.debug('Connection start', { nodeId, handleId });
  }, []);

  // Handle connection end
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    setConnectionStartNode(null);
    setConnectionStartHandle(null);
    logger.debug('Connection end');
  }, []);

  // Handle connection complete
  const onConnectComplete = useCallback((params: Connection) => {
    logger.debug('Connection complete', params);
    setEdges((eds) => [...eds, { ...params, type: 'default' }]);
  }, [setEdges]);

  if (isLoading) {
    return <div>Loading device configuration...</div>;
  }

  if (error) {
    logger.error('Error loading device configuration', error);
    return <div>Error loading device configuration: {error.message}</div>;
  }

  return (
    <div className="network-topology">
      <ReactFlowProvider>
        <div className="network-flow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnectComplete}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            nodeOrigin={nodeOrigin}
            connectionMode={ConnectionMode.Loose}
            fitView
            defaultEdgeOptions={{
              type: 'default',
              animated: true
            }}
          >
            <Background variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>

          {/* Render context menu at ReactFlow level */}
          {contextMenu.show && (
            <InterfaceContextMenu
              interfaces={contextMenu.interfaces}
              position={contextMenu.position}
              onSelect={onInterfaceSelect}
              onClose={() => setContextMenu(prev => ({ ...prev, show: false }))}
            />
          )}
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
};

export default NetworkTopology;
