/**
 * API functions for saving and loading network topology configurations
 */

import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/paths';
import { prepareConfigForSave } from '../utils/configUtils';

interface SaveConfigResponse {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * Save network topology configuration to the configs folder
 * @param config Configuration data to save
 * @returns Promise that resolves with the saved config filename
 */
export const saveConfig = async (config: any): Promise<string> => {
  try {
    // Prepare config for saving by converting paths
    const preparedConfig = prepareConfigForSave(config);
    logger.debug('Saving network config', { 
      nodeCount: preparedConfig.nodes.length,
      edgeCount: preparedConfig.edges.length
    });
    
    const response = await fetch(`${API_BASE_URL}/api/config/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config: preparedConfig }),
    });

    const responseText = await response.text();
    let data: SaveConfigResponse;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error('Failed to parse save response', { response: responseText });
      throw new Error('Invalid server response format');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to save config: ${response.statusText}`);
    }

    if (!data.filename) {
      throw new Error('No filename returned from server');
    }

    logger.debug('Config saved successfully', { filename: data.filename });
    return data.filename;
  } catch (error) {
    logger.error('Error saving config:', error);
    throw error;
  }
};
