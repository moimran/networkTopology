/**
 * Path Utilities
 * 
 * Helper functions for path manipulation and validation.
 */

import { join } from 'path';
import { paths } from '../config/paths.js';

/**
 * Convert a client path to filesystem path
 * @param {string} clientPath - Path from client request
 * @returns {string} Absolute filesystem path
 */
export const clientPathToFsPath = (clientPath) => {
  // Remove leading slash but preserve src directory
  const relativePath = clientPath.replace(/^\//, '');
  return join(paths.projectRoot, relativePath);
};

/**
 * Get default config path for an icon
 * @param {string} iconPath - Path to icon file
 * @returns {string} Path to config file
 */
export const getDefaultConfigPath = (iconPath) => {
  return iconPath
    .replace('/icons/', '/deviceconfigs/')
    .replace(/\.(svg|png)$/, '.json');
};
