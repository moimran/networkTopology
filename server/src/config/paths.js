/**
 * Server Path Configuration
 * 
 * Centralizes all path configurations for the server application.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base paths
const SERVER_ROOT = join(__dirname, '..', '..');
const PROJECT_ROOT = join(SERVER_ROOT, '..');

// Root path is two levels up from config directory
const rootPath = join(__dirname, '..', '..', '..');

export const paths = {
  // Root paths
  projectRoot: PROJECT_ROOT,
  serverRoot: SERVER_ROOT,
  root: rootPath,
  
  // Config paths
  configs: join(rootPath, 'configs'),
  
  // Asset paths
  assets: {
    root: join(PROJECT_ROOT, 'src', 'assets'),
    icons: join(PROJECT_ROOT, 'src', 'assets', 'icons'),
    deviceConfigs: join(PROJECT_ROOT, 'src', 'assets', 'deviceconfigs'),
  },
};
