/**
 * Config Controller
 * 
 * Handles operations related to device configurations.
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { paths } from '../config/paths.js';

/**
 * Save network topology configuration
 */
export const saveConfig = (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ 
        success: false,
        error: 'No config data provided' 
      });
    }

    // Create configs directory if it doesn't exist
    if (!fs.existsSync(paths.configs)) {
      fs.mkdirSync(paths.configs, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `network-config-${timestamp}.json`;
    const filePath = path.join(paths.configs, filename);

    // Validate config before saving
    try {
      // Check if it's valid JSON
      JSON.stringify(config);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config format: not valid JSON'
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log('Config saved successfully:', { filename, size: JSON.stringify(config).length });
    
    res.json({ 
      success: true, 
      filename,
      path: filePath
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save config',
      details: error.message
    });
  }
};

/**
 * Restore network topology configuration from URL or local file
 */
export const restoreConfig = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL or file path is required' 
      });
    }

    let configData;
    console.log('Restore config request:', { url });

    // Check if it's a local file path
    if (url.startsWith('/') || url.includes('configs/')) {
      // Handle both absolute and relative paths
      let configPath;
      if (url.startsWith('/')) {
        // Absolute path - remove leading slash and join with root
        configPath = path.join(paths.root, url.slice(1));
      } else {
        // Relative path - join with root directly
        configPath = path.join(paths.root, url);
      }

      console.log('Loading local config file:', { configPath });

      if (!fs.existsSync(configPath)) {
        return res.status(404).json({
          success: false,
          error: 'Config file not found',
          details: `File not found: ${configPath}`
        });
      }

      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent);
        console.log('Successfully loaded config file:', { 
          path: configPath,
          nodeCount: configData.nodes?.length || 0
        });
      } catch (e) {
        console.error('Error parsing config file:', e);
        return res.status(400).json({
          success: false,
          error: 'Invalid config file format',
          details: e.message
        });
      }
    } else {
      // It's a remote URL
      console.log('Loading remote config:', { url });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      configData = await response.json();
    }

    // Validate the config data
    if (!configData || !configData.nodes) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config format',
        details: 'Config must contain nodes array'
      });
    }

    console.log('Config loaded successfully:', {
      nodeCount: configData.nodes.length,
      edgeCount: configData.edges?.length || 0
    });

    res.json({ 
      success: true,
      config: configData 
    });
  } catch (error) {
    console.error('Error restoring config:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to restore config',
      details: error.message
    });
  }
};
