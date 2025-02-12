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

      // Show interface modal at click position
      setInterfaceModal({
        show: true,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
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
          edgeType: 'straight', // Set straight as the default edge type
          sourceInterface: pendingConnection.sourceInterface,
          targetInterface: interfaceName,
          // Find and store interface labels
          sourceInterfaceLabel: getNodeInterfaces(pendingConnection.sourceNodeId)
            .find(i => i.interfaceName === pendingConnection.sourceInterface)?.interfaceLabel,
          targetInterfaceLabel: getNodeInterfaces(selectedNode)
            .find(i => i.interfaceName === interfaceName)?.interfaceLabel,
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
  }, [interfaceModal.nodeId, pendingConnection, setEdges, showLabels]);

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
    event.preventDefault();
    setSelectedEdges(prev => {
      const isSelected = prev.includes(edge.id);
      // Single click selects one edge, Shift+click adds to selection
      if (isSelected) {
        return prev.filter(id => id !== edge.id); // Deselect if already selected
      } else if (event.shiftKey) {
        return [...prev, edge.id]; // Add to selection with shift
      } else {
        return [edge.id]; // Select only this edge
      }
    });
  }, []);

  /**
   * Clear edge selection when clicking anywhere except toolbox and edges
   */
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const isToolboxClick = (event.target as Element)?.closest('.toolbox-container');
    const isEdgeClick = (event.target as Element)?.closest('.react-flow__edge');
    if (!isToolboxClick && !isEdgeClick) {
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
   * Handle edge type change for selected edges only
   */
  const onEdgeTypeChange = useCallback((type: string) => {
    // Only update if there are selected edges
    if (selectedEdges.length > 0) {
      console.log('Changing edge type:', { selectedEdges, newType: type });
      setEdges((eds) => {
        const newEdges = eds.map((edge) => {
          // Only change type for selected edges
          if (selectedEdges.includes(edge.id)) {
            console.log('Updating edge:', { id: edge.id, oldType: edge.data?.edgeType, newType: type });
            return {
              ...edge,
              type: 'floating',
              data: {
                ...edge.data,
                edgeType: type,
                // Preserve existing labels and interface data
                sourceInterface: edge.data?.sourceInterface,
                targetInterface: edge.data?.targetInterface,
                sourceInterfaceLabel: edge.data?.sourceInterfaceLabel,
                targetInterfaceLabel: edge.data?.targetInterfaceLabel,
                showLabels: edge.data?.showLabels,
              },
            };
          }
          // Keep other edges unchanged
          return edge;
        });
        console.log('Edge update complete');
        return newEdges;
      });
    }
  }, [selectedEdges, setEdges]);

  // Handle click outside of nodes to clear interface selection
  const onPaneClickOutside = useCallback(() => {
    setInterfaceModal({
      show: false,
      position: { x: 0, y: 0 },
      nodeId: null,
    });
    setPendingConnection(null);
    // Clear selected interface from all nodes
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        selectedInterface: undefined,
      },
    })));
  }, []);

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
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClickOutside}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodeOrigin={nodeOrigin}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="network-flow"
            minZoom={0.1}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: 'floating',
              data: { edgeType: 'straight' },
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
