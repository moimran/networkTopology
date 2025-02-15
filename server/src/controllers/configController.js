/**
 * Config Controller
 * 
 * Handles operations related to device configurations.
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { paths } from '../config/paths.js';

export const saveConfig = (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'No config data provided' });
    }

    const timestamp = Date.now();
    const filename = `network-config-${timestamp}.json`;
    const filePath = path.join(paths.configs, filename);

    // Create configs directory if it doesn't exist
    if (!fs.existsSync(paths.configs)) {
      fs.mkdirSync(paths.configs, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    res.json({ success: true, filename });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save config' });
  }
};

export const restoreConfig = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }

    const config = await response.json();
    res.json(config);
  } catch (error) {
    console.error('Error restoring config:', error);
    res.status(500).json({ error: 'Failed to restore config' });
  }
};
