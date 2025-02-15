/**
 * Icon Metadata API Module
 * 
 * Handles interaction with the server for icon metadata operations.
 * Provides a clean interface for fetching icon metadata and associated config paths.
 */

import { logger } from '../utils/logger';
import { DEVICE_CONFIGS_PATH, API_BASE_URL } from '../config/paths';
import { formatPathForApi, formatPathFromApi } from '../utils/pathUtils';

/**
 * Get the configuration path for an icon
 * @param iconPath - Path to the icon file
 * @returns The full path to the device configuration file
 * @throws Error if metadata cannot be retrieved
 */
export const getIconConfigPath = async (iconPath: string): Promise<string> => {
  try {
    // Format path for API request
    const apiPath = formatPathForApi(iconPath);
    
    logger.debug('Fetching icon metadata', { 
      clientPath: iconPath,
      apiPath 
    });
    
    const response = await fetch(`${API_BASE_URL}/api/icon/metadata?path=${encodeURIComponent(apiPath)}`);
    
    // Get the response text first for better error handling
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = { error: responseText };
      }
      throw new Error(errorDetails.details || errorDetails.error || 'Failed to get icon metadata');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error('Failed to parse server response', { response: responseText });
      throw new Error('Invalid server response format');
    }
    
    const { configPath } = data;
    if (!configPath) {
      throw new Error('No config path found in icon metadata');
    }
    
    // Convert config path to client format
    const clientConfigPath = formatPathFromApi(configPath);
    
    logger.debug('Retrieved config path from metadata', { 
      iconPath, 
      configPath: clientConfigPath 
    });
    
    return clientConfigPath;
  } catch (error) {
    logger.error('Error getting icon config path', { iconPath, error });
    throw error;
  }
};
