import { useCallback, useState } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition } from '@xyflow/react';
import { getIconConfigPath } from '../api/iconMetadata';
import { calculateHandlePositions } from '../utils/deviceUtils';
import { NodeIdGenerator } from '../utils/nodeUtils';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/paths';

export interface UseNetworkNodesReturn {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  handleNodesChange: (changes: NodeChange[]) => void;
  createNodeWithConfig: (position: XYPosition, iconPath: string) => Promise<Node | undefined>;
  onNodesDelete: (deleted: Node[]) => void;
  clearSelectedInterface: () => void;
}

export const useNetworkNodes = (setEdges: React.Dispatch<React.SetStateAction<any[]>>): UseNetworkNodesReturn => {
  const [nodes, setNodes] = useState<Node[]>([]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    logger.debug('Nodes changed', { changes });
  }, []);

  const createNodeWithConfig = useCallback(async (position: XYPosition, iconPath: string) => {
    try {
      logger.debug('Creating node with icon', { iconPath });
      
      // Get config path using the metadata API
      const configPath = await getIconConfigPath(iconPath);
      logger.debug('Got config path from metadata', { configPath });
      
      // Extract the relative path part (after deviceconfigs/)
      const relativePath = configPath.split('/deviceconfigs/')[1];
      if (!relativePath) {
        throw new Error('Invalid config path format');
      }

      // Load the device configuration from the API
      const response = await fetch(`${API_BASE_URL}/api/config/device/${relativePath}`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to load device config: ${error}`);
      }
      
      const config = await response.json();
      logger.debug('Loaded device config', { config });

      const nodeId = NodeIdGenerator.generateNodeId();
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

      logger.debug('Created new node', { 
        nodeId, 
        deviceType: config.deviceType, 
        interfaceCount: Object.keys(handles).length 
      });
      return newNode;
    } catch (error) {
      logger.error('Error creating node with config', error);
      throw error;
    }
  }, []);

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
  }, [setEdges]);

  const clearSelectedInterface = useCallback(() => {
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        selectedInterface: undefined,
      },
    })));
  }, []);

  return {
    nodes,
    setNodes,
    handleNodesChange,
    createNodeWithConfig,
    onNodesDelete,
    clearSelectedInterface,
  };
};
