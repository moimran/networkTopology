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
import InterfaceSelectModal from './InterfaceSelectModal/InterfaceSelectModal';
import FloatingEdge from './FloatingEdge/FloatingEdge';
import Toolbox from './Toolbox/Toolbox';
import Toolbar from './Toolbar/Toolbar';
import './FloatingEdge/FloatingEdge.css';
import '../styles/components/networkTopology.css';

/**
 * Custom node types configuration
 */
const nodeTypes = {
  networkNode: NetworkNode,
};

/**
 * Edge types configuration
 */
const edgeTypes = {
  floating: FloatingEdge,
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentEdgeType, setCurrentEdgeType] = useState('straight');
  const [showLabels, setShowLabels] = useState(false);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  
  // Custom hooks for managing nodes and edges
  const { edges, onEdgesChange, setEdges } = useNetworkEdges();
  const { createDeviceNode, isLoading, error } = useDeviceNodes(DEVICE_CONFIG_PATH);

  // Interface select modal state
  const [interfaceModal, setInterfaceModal] = useState<{
    show: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    nodeId: null,
  });

  // Connection state
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourceHandleId: string;
    sourceInterface: string;
  } | null>(null);

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

  // Handle node interface selection
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Prevent native context menu from showing
      event.preventDefault();

      // Get the node's DOM element
      const nodeElement = event.currentTarget as HTMLDivElement;
      const nodeBounds = nodeElement.getBoundingClientRect();

      // Position the modal overlapping slightly with the node's right side
      const position = {
        x: nodeBounds.right - 10, // Move modal more to the left to overlap
        y: nodeBounds.bottom - 40, // Position near the top of the node
      };

      // Show our custom context menu
      setInterfaceModal({
        show: true,
        position,
        nodeId: node.id,
      });
    },
    []
  );

  // Handle interface selection from modal
  const onInterfaceSelect = useCallback((interfaceName: string) => {
    const selectedNode = interfaceModal.nodeId;
    if (!selectedNode) return;

    if (!pendingConnection) {
      // This is the source node selection
      logger.debug('Source interface selected', { nodeId: selectedNode, interfaceName });
      
      // Store the source connection info
      setPendingConnection({
        sourceNodeId: selectedNode,
        sourceHandleId: interfaceName,
        sourceInterface: interfaceName,
      });

      // Show the selected handle on the source node
      setNodes(nodes => nodes.map(node => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedInterface: interfaceName,
            },
          };
        }
        return node;
      }));
    } else {
      // This is the target node selection
      logger.debug('Target interface selected', {
        source: pendingConnection,
        target: { nodeId: selectedNode, interfaceName }
      });

      // Create the connection
      const newEdge: Connection = {
        id: `${pendingConnection.sourceNodeId}-${pendingConnection.sourceInterface}-${selectedNode}-${interfaceName}`,
        source: pendingConnection.sourceNodeId,
        sourceHandle: pendingConnection.sourceInterface,
        target: selectedNode,
        targetHandle: interfaceName,
        type: 'floating',
        data: {
          edgeType: currentEdgeType,
          sourceInterface: pendingConnection.sourceInterface,
          targetInterface: interfaceName,
          showLabels: showLabels,
        },
      };

      setEdges(edges => [...edges, newEdge]);

      // Clear the pending connection and selected handles
      setPendingConnection(null);
      setNodes(nodes => nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          selectedInterface: null,
        },
      })));
    }

    // Hide the modal
    setInterfaceModal(prev => ({ ...prev, show: false }));
  }, [interfaceModal.nodeId, pendingConnection, setEdges, currentEdgeType, showLabels]);

  const getNodeInterfaces = useCallback((nodeId: string | null) => {
    if (!nodeId) return [];
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.config?.interfaces || [];
  }, [nodes]);

  const getConnectedInterfaces = useCallback((nodeId: string) => {
    return edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => edge.source === nodeId ? edge.sourceHandle : edge.targetHandle)
      .filter((handle): handle is string => handle !== undefined);
  }, [edges]);

  const handleDeleteNode = useCallback(() => {
    if (interfaceModal.nodeId) {
      const nodeToDelete = interfaceModal.nodeId;

      // Delete all connected edges
      const updatedEdges = edges.filter(
        edge => edge.source !== nodeToDelete && edge.target !== nodeToDelete
      );
      setEdges(updatedEdges);

      // Delete the node
      setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeToDelete));

      // Close the modal
      setInterfaceModal(prev => ({ ...prev, show: false }));

      logger.debug('Deleted node', { nodeId: nodeToDelete });
    }
  }, [interfaceModal.nodeId, edges, setEdges, setNodes]);

  const handleToggleLabels = useCallback(() => {
    setShowLabels(prev => {
      const newShowLabels = !prev;
      // Update all existing edges with new label visibility
      const updatedEdges = edges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          showLabels: newShowLabels,
        },
      }));
      setEdges(updatedEdges);
      return newShowLabels;
    });
  }, [edges, setEdges]);

  /**
   * Handle edge selection
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Connection) => {
    event.stopPropagation();
    setSelectedEdges(prev => {
      const isSelected = prev.includes(edge.id);
      if (isSelected) {
        return [];
      } else if (event.shiftKey) {
        return [...prev, edge.id];
      } else {
        return [edge.id];
      }
    });
  }, []);

  /**
   * Clear edge selection when clicking anywhere except toolbox
   */
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    // Check if the click target is within the toolbox
    const isToolboxClick = (event.target as Element)?.closest('.toolbox-container');
    if (!isToolboxClick) {
      setSelectedEdges([]);
    }
  }, []);

  /**
   * Clear edge selection when clicking on nodes or dragging
   */
  const onNodeClick = useCallback(() => {
    setSelectedEdges([]);
  }, []);

  const onNodeDragStart = useCallback(() => {
    setSelectedEdges([]);
  }, []);

  /**
   * Handle edge type change for selected edges or set default type
   */
  const onEdgeTypeChange = useCallback((type: string) => {
    setCurrentEdgeType(type);
    setEdges((eds) => {
      if (selectedEdges.length === 0) {
        // If no edges are selected, update all edges
        return eds.map((edge) => ({
          ...edge,
          data: { ...edge.data, edgeType: type },
        }));
      } else {
        // If edges are selected, only update selected edges
        return eds.map((edge) => {
          if (selectedEdges.includes(edge.id)) {
            return {
              ...edge,
              data: { ...edge.data, edgeType: type },
            };
          }
          return edge;
        });
      }
    });
  }, [selectedEdges, setEdges]);

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
          <div className="absolute inset-0 flex items-center">
            <Toolbox 
              onEdgeTypeChange={onEdgeTypeChange}
              selectedEdges={selectedEdges}
            />
          </div>
          <Toolbar 
            showLabels={showLabels}
            onToggleLabels={handleToggleLabels}
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodeOrigin={nodeOrigin}
            connectionMode={ConnectionMode.Loose}
            fitView
            defaultEdgeOptions={{
              type: 'floating',
              animated: false,
              className: 'selectable-edge'
            }}
          >
            <Background variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>

          {/* Render interface select modal */}
          <InterfaceSelectModal
            show={interfaceModal.show}
            interfaces={getNodeInterfaces(interfaceModal.nodeId)}
            connectedInterfaces={interfaceModal.nodeId ? getConnectedInterfaces(interfaceModal.nodeId) : []}
            position={interfaceModal.position}
            onSelect={onInterfaceSelect}
            onClose={() => setInterfaceModal(prev => ({ ...prev, show: false }))}
            onDelete={handleDeleteNode}
          />
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
};

export default NetworkTopology;
