/**
 * Config Utilities
 * 
 * Handles transformations of config data for saving and loading.
 */

import { Node, Edge } from 'reactflow';
import { logger } from './logger';
import { ASSETS_BASE_PATH } from '../config/paths';

interface TopologyConfig {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Convert absolute paths to relative paths for saving
 * @param config The topology configuration to prepare for saving
 * @returns Config with relative paths
 */
export const prepareConfigForSave = (config: TopologyConfig): TopologyConfig => {
  const nodes = config.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      iconPath: node.data.iconPath?.replace(`${ASSETS_BASE_PATH}/`, ''),
      config: {
        ...node.data.config,
        // Store only the device type and interfaces, not the full config
        deviceType: node.data.config.deviceType,
        interfaces: node.data.config.interfaces.map((iface: any) => ({
          interfaceName: iface.interfaceName,
          type: iface.type
        }))
      }
    }
  }));

  return {
    ...config,
    nodes
  };
};

/**
 * Convert relative paths to absolute paths for loading
 * @param config The topology configuration to prepare for loading
 * @returns Config with absolute paths
 */
export const prepareConfigForLoad = (config: TopologyConfig): TopologyConfig => {
  const nodes = config.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      iconPath: node.data.iconPath ? `${ASSETS_BASE_PATH}/${node.data.iconPath}` : undefined
    }
  }));

  return {
    ...config,
    nodes
  };
};
