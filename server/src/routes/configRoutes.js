/**
 * Config Routes
 * 
 * Routes for configuration-related operations.
 */

import express from 'express';
import { join } from 'path';
import fs from 'fs';
import { paths } from '../config/paths.js';
import { clientPathToFsPath } from '../utils/pathUtils.js';
import { saveConfig, restoreConfig } from '../controllers/configController.js';

const router = express.Router();

// Save and restore config routes
router.post('/save', saveConfig);
router.get('/restore', restoreConfig);

// Serve device config files
router.get('/device/*', (req, res) => {
  try {
    const configPath = req.params[0];
    if (!configPath) {
      return res.status(400).json({ error: 'Config path is required' });
    }

    // Remove any leading /src/assets/deviceconfigs/ from the path
    const cleanPath = configPath.replace(/^(\/src)?\/assets\/deviceconfigs\//, '');
    
    // Convert to filesystem path
    const fsPath = join(paths.assets.deviceConfigs, cleanPath);
    
    console.log('Loading device config:', {
      requestPath: configPath,
      cleanPath,
      fsPath,
      exists: fs.existsSync(fsPath)
    });

    if (!fs.existsSync(fsPath)) {
      return res.status(404).json({
        error: 'Config file not found',
        details: `File not found: ${fsPath}`
      });
    }

    const configContent = fs.readFileSync(fsPath, 'utf8');
    res.json(JSON.parse(configContent));
  } catch (error) {
    console.error('Error serving device config:', error);
    res.status(500).json({
      error: 'Failed to serve device config',
      details: error.message
    });
  }
});

export default router;
