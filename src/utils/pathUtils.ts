/**
 * Client-side Path Utilities
 * 
 * Handles path conversions and formatting for client-side operations.
 * These utilities ensure consistent path handling when making API requests
 * and managing paths in the browser context.
 */

import { ASSETS_BASE_PATH } from '../config/paths';

/**
 * Convert a client-side asset path to API-compatible path
 * @param clientPath - Path as used in the client (e.g., /src/assets/icons/router/icon.svg)
 * @returns Path formatted for API requests
 */
export const formatPathForApi = (clientPath: string): string => {
  // Ensure path starts with /src if needed
  return clientPath.startsWith('/src') ? clientPath : `/src/${clientPath}`;
};

/**
 * Convert an API response path to client-side path
 * @param apiPath - Path returned from the API
 * @returns Path for client-side use
 */
export const formatPathFromApi = (apiPath: string): string => {
  // Ensure path has correct client-side format
  return apiPath.startsWith('/src') ? apiPath : `/src/${apiPath}`;
};

/**
 * Get the device config path from an icon path (client-side version)
 * @param iconPath - Path to the icon file
 * @returns Path to the corresponding config file
 */
export const getDeviceConfigPath = (iconPath: string): string => {
  return iconPath
    .replace('/icons/', '/deviceconfigs/')
    .replace(/\.(svg|png)$/, '.json');
};
