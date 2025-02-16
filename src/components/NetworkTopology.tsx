import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  ReactFlowInstance,
  NodeOrigin,
  MarkerType,
  MiniMap,
  Panel,
} from '@xyflow/react';

import IconSidebar from './IconSidebar/IconSidebar';
import Toolbox from './Toolbox/Toolbox';
import InterfaceSelectModal from './InterfaceSelectModal/InterfaceSelectModal';
import EdgeContextMenu from './EdgeContextMenu/EdgeContextMenu';
import NetworkNode from './NetworkNode/NetworkNode';
import FloatingEdge from './FloatingEdge/FloatingEdge';
import { logger } from '../utils/logger';
import { useNetworkNodes } from '../hooks/useNetworkNodes';
import { useNetworkEdges } from '../hooks/useNetworkEdges';
import { useInterfaceModal } from '../hooks/useInterfaceModal';
import { useEdgeContextMenu } from '../hooks/useEdgeContextMenu';
import { useEdgeInteractions } from '../hooks/useEdgeInteractions';
import { useEdgeStore } from '../store/edgeStore';
import { saveConfig } from '../api/saveConfig';
import { restoreConfigFromUrl, loadDeviceConfig } from '../api/loadConfig';

import '../styles/components/networkTopology.css';
import './FloatingEdge/FloatingEdge.css';

/**
 * Custom node types configuration
 */
const nodeTypes = {
  networkNode: NetworkNode,
};

/**
 * Custom edge types configuration
 */
const edgeTypes = {
  floating: FloatingEdge,
};

/**
 * Default edge options
 */
const defaultEdgeOptions = {
  type: 'floating',
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#555',
  },
  style: {
    strokeWidth: 2,
    stroke: '#555',
  },
};

/**
 * Default node origin for consistent positioning
 */
const nodeOrigin: NodeOrigin = [0.5, 0.5];

/**
 * NetworkTopology Component
 * 
 * Main component for the network topology visualization.
 * Handles device node creation, connection management, and graph visualization.
 */
const NetworkTopology = () => {
  // Reference to the ReactFlow instance
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [currentEdgeType, setCurrentEdgeType] = useState('straight');
  const [showLabels, setShowLabels] = useState(false);
  const [iconCategories, setIconCategories] = useState<Record<string, string[]>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('horizontal');
  const [isLoading, setIsLoading] = useState(false);
  const [defaultViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [backgroundType, setBackgroundType] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [backgroundConfig, setBackgroundConfig] = useState({
    gap: 12,
    size: 1,
  });

  // Custom hooks for managing nodes and edges
  const { edges, onEdgesChange, setEdges } = useNetworkEdges();
  const { nodes, setNodes, handleNodesChange, createNodeWithConfig, onNodesDelete, clearSelectedInterface } = useNetworkNodes(setEdges);
  const { interfaceModal, onNodeContextMenu, closeInterfaceModal, setInterfaceModal } = useInterfaceModal();
  const { edgeContextMenu, onEdgeContextMenu, closeEdgeContextMenu } = useEdgeContextMenu(setEdges);
  const { onEdgeClick, onEdgeTypeChange, handleToggleLabels } = useEdgeInteractions(edges, setEdges, showLabels, setShowLabels);
  const { selectedEdges } = useEdgeStore();

  // Connection state
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourceHandleId: string;
    sourceInterface: string;
  } | null>(null);

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

  /**
   * Initialize ReactFlow instance
   */
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    logger.debug('ReactFlow initialized');
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
    event.dataTransfer.setData('application/networknode', iconPath);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  /**
   * Handle dropping a new node onto the flow
   * Maintains zoom level and viewport position when adding new nodes
   */
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const iconPath = event.dataTransfer.getData('application/networknode');

      if (!iconPath) {
        logger.warn('No icon path provided in drop event');
        return;
      }

      // Get the current viewport to maintain zoom level
      const viewport = reactFlowInstance.current.getViewport();

      // Calculate the position in the flow where the node was dropped
      const position = {
        x: (event.clientX - reactFlowBounds.left - viewport.x) / viewport.zoom,
        y: (event.clientY - reactFlowBounds.top - viewport.y) / viewport.zoom
      };

      try {
        // Add debug logging for position calculation
        logger.debug('Node drop position:', { 
          position, 
          viewport,
          bounds: {
            left: reactFlowBounds.left,
            top: reactFlowBounds.top
          }
        });
        
        const newNode = await createNodeWithConfig(position, iconPath);
        if (newNode) {
          setNodes((nds) => nds.concat(newNode));
          logger.debug('Added new node to flow', { nodeId: newNode.id });
          
          // Maintain the current zoom level and viewport position
          reactFlowInstance.current.setViewport({ x: 0, y: 0, zoom: viewport.zoom });
        }
      } catch (error) {
        logger.error('Error handling node drop', error);
      }
    },
    [reactFlowInstance, createNodeWithConfig, setNodes]
  );

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
          edgeType: 'straight',
          sourceInterface: pendingConnection.sourceInterface,
          targetInterface: interfaceName,
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
      clearSelectedInterface();
    }

    // Hide the modal
    closeInterfaceModal();
  }, [interfaceModal.nodeId, pendingConnection, setEdges, showLabels, getNodeInterfaces, setNodes, clearSelectedInterface, closeInterfaceModal]);

  /**
   * Clear edge selection when clicking anywhere except toolbox and edges
   */
  const onPaneClick = useCallback(() => {
    closeEdgeContextMenu();
    closeInterfaceModal();
    setPendingConnection(null);
    clearSelectedInterface();
  }, [closeEdgeContextMenu, closeInterfaceModal, clearSelectedInterface]);

  /**
   * Clear edge selection when clicking on nodes or dragging
   */
  const onNodeClick = useCallback(() => {
    // setSelectedEdges([]);
  }, []);

  const onNodeDragStart = useCallback(() => {
    // setSelectedEdges([]);
  }, []);

  // Handle edge deletion
  const handleDeleteEdge = useCallback(() => {
    if (edgeContextMenu.edgeId) {
      logger.debug('Deleting edge', { edgeId: edgeContextMenu.edgeId });
      setEdges((edges) => edges.filter((edge) => edge.id !== edgeContextMenu.edgeId));
      closeEdgeContextMenu();
    }
  }, [edgeContextMenu.edgeId, setEdges, closeEdgeContextMenu]);

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    logger.debug('Deleting node', { nodeId });
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    // Also remove any connected edges
    setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  // Handle saving the current topology configuration
  const handleSaveConfig = useCallback(async () => {
    if (!reactFlowInstance.current) return;

    try {
      setIsLoading(true);
      const config = {
        nodes,
        edges,
        viewport: reactFlowInstance.current.getViewport(),
        currentEdgeType,
        showLabels,
        isDarkMode,
        currentLayout,
        backgroundType,
        backgroundConfig,
      };

      logger.debug('Saving network topology', { 
        nodeCount: nodes.length,
        edgeCount: edges.length 
      });

      const filename = await saveConfig(config);
      logger.debug('Network topology saved', { filename });
    } catch (error) {
      logger.error('Failed to save network topology:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, currentEdgeType, showLabels, isDarkMode, currentLayout, backgroundType, backgroundConfig]);

  // Handle restoring a topology configuration
  const restoreConfig = useCallback(async (configUrl: string) => {
    try {
      setIsLoading(true);
      logger.debug('Loading network topology', { configUrl });

      const config = await restoreConfigFromUrl(configUrl);
      if (!config) {
        throw new Error('Failed to load configuration');
      }

      // Update nodes and edges
      setNodes(config.nodes || []);
      setEdges(config.edges || []);

      // Update other state
      setCurrentEdgeType(config.currentEdgeType || 'straight');
      setShowLabels(config.showLabels || false);
      setIsDarkMode(config.isDarkMode || false);
      setCurrentLayout(config.currentLayout || 'horizontal');
      setBackgroundType(config.backgroundType || BackgroundVariant.Dots);
      setBackgroundConfig(config.backgroundConfig || {
        gap: 12,
        size: 1,
      });

      // Update viewport if available
      if (reactFlowInstance.current && config.viewport) {
        reactFlowInstance.current.setViewport(config.viewport);
      }

      logger.debug('Network topology loaded', { 
        nodeCount: config.nodes?.length || 0,
        edgeCount: config.edges?.length || 0 
      });
    } catch (error) {
      logger.error('Failed to load network topology:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const restoreUrl = urlParams.get('restore');
    if (restoreUrl) {
      restoreConfig(restoreUrl);
    }
  }, [restoreConfig]);

  // Function to load device config when needed
  const loadNodeConfig = useCallback(async (node: Node) => {
    if (node.data.iconPath && !node.data.config) {
      try {
        const config = await loadDeviceConfig(node.data.iconPath);
        // Update node with loaded config
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            config
          }
        };
        setNodes((nds) => 
          nds.map((n) => (n.id === node.id ? updatedNode : n))
        );
      } catch (error) {
        logger.error(`Error loading config for node ${node.id}:`, error);
      }
    }
  }, [setNodes]);

  // Load configs for nodes when they are selected or connected
  useEffect(() => {
    nodes.forEach((node) => {
      if (node.selected) {
        loadNodeConfig(node);
      }
    });
  }, [nodes, loadNodeConfig]);

  // Handle background type change
  const handleBackgroundChange = useCallback((type: BackgroundVariant) => {
    console.log('Changing background to:', type);
    setBackgroundType(type);
  }, []);

  // Handle dark mode toggle
  const handleDarkModeToggle = useCallback(() => {
    console.log('Toggling dark mode');
    setIsDarkMode(prev => !prev);
  }, []);

  return (
    <div className={`network-topology ${isDarkMode ? 'dark' : 'light'}`}>
      <ReactFlowProvider>
        <div 
          className="reactflow-wrapper" 
          ref={reactFlowWrapper}
          style={{ width: '100%', height: '100%' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onEdgeClick={onEdgeClick}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            nodeOrigin={nodeOrigin}
            defaultViewport={defaultViewport}
            minZoom={0.1}
            maxZoom={2}
            fitView={nodes.length === 0}
            style={{ width: '100%', height: '100%' }}
          >
            <Background 
              variant={backgroundType}
              gap={backgroundConfig.gap}
              size={backgroundConfig.size}
            />
            <Controls position="bottom-right" className="controls-container" />
            <MiniMap />
            <Panel position="top-center" className="panel-container">
              <div className="panel-content">
                <h3>Panel Content</h3>
                <p>This is the panel content.</p>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <IconSidebar
          categories={iconCategories || {}}
          onDragStart={onDragStart}
          isDarkMode={isDarkMode}
        />

        <Toolbox
          currentEdgeType={currentEdgeType}
          onEdgeTypeChange={onEdgeTypeChange}
          showLabels={showLabels}
          onToggleLabels={handleToggleLabels}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleDarkModeToggle}
          currentLayout={currentLayout}
          onLayoutChange={setCurrentLayout}
          selectedEdges={selectedEdges}
          onSave={handleSaveConfig}
          isLoading={isLoading}
          backgroundType={backgroundType}
          onBackgroundChange={handleBackgroundChange}
          backgroundConfig={backgroundConfig}
          setBackgroundConfig={setBackgroundConfig}
        />
        
        {interfaceModal.show && (
          <InterfaceSelectModal
            show={interfaceModal.show}
            position={interfaceModal.position}
            interfaces={getNodeInterfaces(interfaceModal.nodeId)}
            onSelect={onInterfaceSelect}
            onClose={closeInterfaceModal}
            onDelete={() => {
              if (interfaceModal.nodeId) {
                handleDeleteNode(interfaceModal.nodeId);
                closeInterfaceModal();
              }
            }}
            connectedInterfaces={getConnectedInterfaces(interfaceModal.nodeId || '')}
            nodeId={interfaceModal.nodeId}
          />
        )}

        {edgeContextMenu.show && (
          <EdgeContextMenu
            show={edgeContextMenu.show}
            position={edgeContextMenu.position}
            onDelete={handleDeleteEdge}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default NetworkTopology;
