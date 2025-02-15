/**
 * API functions for loading network topology configurations
 */

import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/paths';
import { prepareConfigForLoad } from '../utils/configUtils';
import { getIconConfigPath } from './iconMetadata';

interface LoadConfigResponse {
  success: boolean;
  config?: any;
  error?: string;
}

/**
 * Load device configuration for a node
 * @param iconPath Path to the icon file
 * @returns Promise that resolves with the device configuration
 */
export const loadDeviceConfig = async (iconPath: string) => {
  try {
    const configPath = await getIconConfigPath(iconPath);
    logger.debug('Loading device config', { iconPath, configPath });

    // Extract relative path (after deviceconfigs/)
    const relativePath = configPath.split('deviceconfigs/')[1];
    if (!relativePath) {
      throw new Error('Invalid config path format');
    }

    const response = await fetch(`${API_BASE_URL}/api/config/device/${relativePath}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to load device config: ${error}`);
    }

    const config = await response.json();
    logger.debug('Device config loaded', { 
      iconPath, 
      deviceType: config.deviceType 
    });
    return config;
  } catch (error) {
    logger.error('Error loading device config:', error);
    throw error;
  }
};

/**
 * Load network topology configuration from a URL
 * @param url URL to load configuration from
 * @returns Promise that resolves with the loaded configuration
 */
export const restoreConfigFromUrl = async (url: string) => {
  try {
    logger.debug('Loading network config from URL', { url });
    
    const response = await fetch(`${API_BASE_URL}/api/config/restore?url=${encodeURIComponent(url)}`);
    const responseText = await response.text();
    
    let data: LoadConfigResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error('Failed to parse load response', { response: responseText });
      throw new Error('Invalid server response format');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to load config: ${response.statusText}`);
    }

    if (!data.config) {
      throw new Error('No config data in response');
    }

    // Convert relative paths to absolute
    const preparedConfig = prepareConfigForLoad(data.config);
    logger.debug('Config prepared for loading', { 
      nodeCount: preparedConfig.nodes.length 
    });

    // Load full device configs for each node
    for (const node of preparedConfig.nodes) {
      if (node.data.iconPath) {
        try {
          node.data.config = await loadDeviceConfig(node.data.iconPath);
        } catch (error) {
          logger.error('Failed to load device config for node', {
            nodeId: node.id,
            iconPath: node.data.iconPath,
            error
          });
        }
      }
    }

    logger.debug('Config loaded successfully', { 
      nodeCount: preparedConfig.nodes.length,
      edgeCount: preparedConfig.edges.length 
    });

    return preparedConfig;
  } catch (error) {
    logger.error('Error loading config:', error);
    throw error;
  }
};
