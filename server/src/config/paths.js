/**
 * Server Path Configuration
 * 
 * Centralizes all path configurations for the server.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base paths
const SERVER_ROOT = join(__dirname, '..', '..');
const PROJECT_ROOT = join(SERVER_ROOT, '..');

export const paths = {
  // Root paths
  projectRoot: PROJECT_ROOT,
  serverRoot: SERVER_ROOT,
  
  // Asset paths
  assets: {
    root: join(PROJECT_ROOT, 'src', 'assets'),
    icons: join(PROJECT_ROOT, 'src', 'assets', 'icons'),
    deviceConfigs: join(PROJECT_ROOT, 'src', 'assets', 'deviceconfigs'),
  },
  
  // Config paths
  configs: join(PROJECT_ROOT, 'configs'),
};
