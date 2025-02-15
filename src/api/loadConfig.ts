/**
 * API functions for loading network topology configurations
 */

/**
 * Load device configuration from the specified path
 * @param configPath Path to the device configuration file
 * @returns Promise that resolves with the device configuration
 */
export const loadDeviceConfig = async (configPath: string): Promise<any> => {
  try {
    const response = await fetch(`/api/device-config/${configPath}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load device config: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading device config:', error);
    throw error;
  }
};

/**
 * Restore network topology configuration from a URL
 * @param url URL pointing to the configuration file to restore
 * @returns Promise that resolves with the restored configuration
 */
export const restoreConfigFromUrl = async (url: string): Promise<any> => {
  try {
    const response = await fetch(`/api/restore-config?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to restore config: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to restore config');
    }

    return result.config;
  } catch (error) {
    console.error('Error restoring config:', error);
    throw error;
  }
};
