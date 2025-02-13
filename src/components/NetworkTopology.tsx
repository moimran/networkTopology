import { useState, DragEvent, useCallback, useRef, useMemo, useEffect } from 'react';
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
  Edge,
  Connection,
  OnConnectStartParams,
} from '@xyflow/react';

import { useDeviceNodes } from '../hooks/useDeviceNodes';
import { useNetworkEdges } from '../hooks/useNetworkEdges';
import { logger } from '../utils/logger';
import { useEdgeStore, useSelectedEdges } from '../store/edgeStore';
import { generateNodeId } from '../utils/nodeUtils';
import { calculateHandlePositions } from '../utils/deviceUtils';
import NetworkNode from './NetworkNode/NetworkNode';
import InterfaceSelectModal from './InterfaceSelectModal/InterfaceSelectModal';
import FloatingEdge from './FloatingEdge/FloatingEdge';
import Toolbox from './Toolbox/Toolbox';
import Toolbar from './Toolbar/Toolbar';
import IconSidebar from './IconSidebar/IconSidebar';
import EdgeContextMenu from './EdgeContextMenu/EdgeContextMenu';
import './FloatingEdge/FloatingEdge.css';
import '../styles/components/networkTopology.css';

// Asset paths configuration
const ASSETS_BASE_PATH = '/src/assets';
const ICONS_PATH = `${ASSETS_BASE_PATH}/icons`;
const DEVICE_CONFIGS_PATH = `${ASSETS_BASE_PATH}/deviceconfigs`;

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
const DEVICE_CONFIG_PATH = `${DEVICE_CONFIGS_PATH}/router-2d-gen-dark-s.json`;

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
  const [iconCategories, setIconCategories] = useState<Record<string, string[]>>({});
  
  // Load icons on component mount
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const categories = ['cloud', 'dot', 'globe', 'hub', 'pc', 'router', 'server', 'switch'];
        const loadedCategories: Record<string, string[]> = {};

        // Load all icons in each category
        const icons = import.meta.glob('../assets/icons/**/*.{svg,png}', { eager: true });
        
        // Organize icons by category
        for (const category of categories) {
          const categoryIcons = Object.entries(icons)
            .filter(([path]) => path.includes(`/icons/${category}/`))
            .map(([path, module]: [string, any]) => module.default);

          if (categoryIcons.length > 0) {
            loadedCategories[category] = categoryIcons;
            logger.debug(`Loaded icons for category ${category}:`, categoryIcons);
          }
        }

        setIconCategories(loadedCategories);
      } catch (error) {
        logger.error('Error loading icons:', error);
      }
    };

    loadIcons();
  }, []);

  // Custom hooks for managing nodes and edges
  const { edges, onEdgesChange, setEdges } = useNetworkEdges();
  const { createDeviceNode, isLoading, error } = useDeviceNodes(DEVICE_CONFIG_PATH);

  // Function to create a node with a specific config
  const createNodeWithConfig = useCallback(async (position: XYPosition, iconPath: string) => {
    try {
      // Convert icon path to config path
      const configPath = iconPath
        .replace('/icons/', '/deviceconfigs/')
        .replace(/\.(svg|png)$/, '.json');
      
      logger.debug('Loading device config', { configPath });
      
      const configResponse = await fetch(configPath);
      if (!configResponse.ok) {
        throw new Error(`Failed to load device config: ${configResponse.statusText}`);
      }
      const config = await configResponse.json();

      const nodeId = generateNodeId();
      const handlePositions = calculateHandlePositions(config.interfaces);

      // Create handles for each interface
      const handles = config.interfaces.reduce((acc, iface, index) => {
        acc[iface.interfaceName] = {
          type: 'source' as const,
          position: handlePositions[index].position,
          interface: iface
        };
        return acc;
      }, {} as Record<string, any>);

      const newNode: Node = {
        id: nodeId,
        type: 'networkNode',
        position,
        data: {
          config,
          iconPath,
          handles,
        },
        draggable: true,
        selectable: true,
      };

      logger.debug('Created new node', { nodeId, config: config.deviceType, interfaces: Object.keys(handles).length });
      return newNode;
    } catch (error) {
      logger.error('Error creating node with config', error);
      throw error;
    }
  }, []);

  // Create a device node with custom config path
  const createCustomDeviceNode = useCallback(async (configPath: string, position: XYPosition) => {
    const { createDeviceNode } = useDeviceNodes(configPath);
    return createDeviceNode(position);
  }, []);

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

  // Edge selection state from store
  const { setSelectedEdges } = useEdgeStore();
  const selectedEdges = useSelectedEdges();

  // State for edge context menu
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    edgeId: string | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    edgeId: null,
  });

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

  const onDragStart = useCallback((event: DragEvent<HTMLDivElement>, iconPath: string) => {
    logger.debug('Starting drag', { iconPath });
    event.dataTransfer.setData('application/reactflow', 'networkNode');
    event.dataTransfer.setData('icon', iconPath);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const iconPath = event.dataTransfer.getData('icon');

      if (!type || !reactFlowBounds || !reactFlowInstance) {
        logger.warn('Invalid drop event', { type, hasBounds: !!reactFlowBounds, hasInstance: !!reactFlowInstance });
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      try {
        const newNode = await createNodeWithConfig(position, iconPath);
        if (newNode) {
          setNodes((nds) => nds.concat(newNode));
          logger.debug('Added new node to flow', { nodeId: newNode.id });
        }
      } catch (error) {
        logger.error('Error handling node drop', error);
      }
    },
    [reactFlowInstance, createNodeWithConfig]
  );

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

  // Handle delete node action
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

  // Handle keyboard delete
  const onNodesDelete = useCallback((deleted: Node[]) => {
    deleted.forEach(node => {
      if (node.id) {
        // Delete connected edges
        setEdges(prevEdges => 
          prevEdges.filter(edge => 
            edge.source !== node.id && edge.target !== node.id
          )
        );

        // Delete the node
        setNodes(prevNodes => 
          prevNodes.filter(n => n.id !== node.id)
        );
      }
    });
  }, [setEdges, setNodes]);

  // Handle edge context menu
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // Prevent default context menu
      event.preventDefault();
      event.stopPropagation();

      // Show context menu at click position
      setEdgeContextMenu({
        show: true,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        edgeId: edge.id,
      });
    },
    []
  );

  // Handle edge deletion
  const handleDeleteEdge = useCallback(() => {
    if (edgeContextMenu.edgeId) {
      // Delete the edge
      setEdges(prevEdges => 
        prevEdges.filter(edge => edge.id !== edgeContextMenu.edgeId)
      );

      // Close the context menu
      setEdgeContextMenu(prev => ({ ...prev, show: false }));
    }
  }, [edgeContextMenu.edgeId, setEdges]);

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
   * Handle edge click events for selection
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdges((prev) => {
      if (event.ctrlKey || event.metaKey) {
        return prev.includes(edge.id) 
          ? prev.filter(id => id !== edge.id)  // Remove if already selected
          : [...prev, edge.id];                // Add to selection
      } else {
        return [edge.id]; // Select only this edge
      }
    });
  }, [setSelectedEdges]);

  /**
   * Clear edge selection when clicking anywhere except toolbox and edges
   */
  const onPaneClick = useCallback(() => {
    // Close edge context menu
    setEdgeContextMenu({
      show: false,
      position: { x: 0, y: 0 },
      edgeId: null,
    });

    // Close node interface modal
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

  /**
   * Clear edge selection when clicking on nodes or dragging
   */
  const onNodeClick = useCallback(() => {
    setSelectedEdges([]);
  }, [setSelectedEdges]);

  const onNodeDragStart = useCallback(() => {
    setSelectedEdges([]);
  }, [setSelectedEdges]);

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

  // Memoize static objects
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  const memoizedNodeOrigin = useMemo(() => nodeOrigin, []);
  const memoizedDefaultEdgeOptions = useMemo(() => ({
    type: 'floating',
    data: { edgeType: 'straight' },
  }), []);

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
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onNodesDelete={onNodesDelete}
            nodeTypes={memoizedNodeTypes}
            edgeTypes={memoizedEdgeTypes}
            nodeOrigin={memoizedNodeOrigin}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="network-flow"
            minZoom={0.1}
            maxZoom={1.5}
            defaultEdgeOptions={memoizedDefaultEdgeOptions}
          >
            <Background variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>
          <Toolbox 
            onEdgeTypeChange={onEdgeTypeChange}
            selectedEdges={selectedEdges}
          />
          <IconSidebar iconCategories={iconCategories} onDragStart={onDragStart} />
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
          {/* Render edge context menu */}
          <EdgeContextMenu
            show={edgeContextMenu.show}
            position={edgeContextMenu.position}
            onDelete={handleDeleteEdge}
          />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default NetworkTopology;
