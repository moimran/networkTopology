/**
 * Icon Controller
 * 
 * Handles operations related to icon files and their metadata.
 */

import fs from 'fs';
import sharp from 'sharp';
import { DOMParser } from '@xmldom/xmldom';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { clientPathToFsPath, getDefaultConfigPath } from '../utils/pathUtils.js';
import { paths } from '../config/paths.js';

/**
 * Extract metadata from PNG file using sharp
 * @param {string} filePath - Path to PNG file
 * @returns {Promise<string|null>} Config path if found
 */
async function extractPngMetadata(filePath) {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Check if we have any metadata
    if (!metadata.exif) {
      console.log('No EXIF data found in PNG');
      return null;
    }

    // Try to find our custom metadata
    const exifBuffer = metadata.exif;
    const exifString = exifBuffer.toString('utf-8');

    // Look for ConfigPath in the EXIF data
    const configPathMatch = exifString.match(/ConfigPath[=:]([^\n]+)/);
    if (configPathMatch) {
      return configPathMatch[1].trim();
    }

    console.log('No ConfigPath found in EXIF data:', { exifString });
    return null;
  } catch (error) {
    console.warn('Error reading PNG metadata:', error);
    return null;
  }
}

export const getIconMetadata = async (req, res) => {
  try {
    const iconPath = req.query.path;
    if (!iconPath) {
      return res.status(400).json({ error: 'Icon path is required' });
    }

    // Convert to filesystem path
    const fsPath = clientPathToFsPath(iconPath);
    
    console.log('Reading metadata for icon:', { 
      requestPath: iconPath,
      fsPath,
      exists: fs.existsSync(fsPath),
      assetsRoot: paths.assets.root,
      iconsDir: paths.assets.icons,
      projectRoot: paths.projectRoot
    });
    
    // Verify file exists
    if (!fs.existsSync(fsPath)) {
      return res.status(404).json({ 
        error: 'Icon file not found',
        details: `File not found: ${fsPath}`,
        paths: {
          requested: iconPath,
          resolved: fsPath,
          assetsRoot: paths.assets.root,
          iconsDir: paths.assets.icons
        }
      });
    }
    
    let configPath = null;
    
    // Handle SVG files
    if (fsPath.endsWith('.svg')) {
      const svgContent = await readFile(fsPath, 'utf8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svg = doc.documentElement;
      configPath = svg.getAttribute('data-config-path');
      console.log('SVG metadata read:', { configPath });
    }
    // Handle PNG files
    else if (fsPath.endsWith('.png')) {
      configPath = await extractPngMetadata(fsPath);
      console.log('PNG metadata read:', { configPath });
    }

    // If no metadata found, use fallback path
    if (!configPath) {
      configPath = getDefaultConfigPath(iconPath);
      console.log('Using fallback config path:', { configPath });
    }

    // Ensure config path starts with /src/assets/deviceconfigs/
    if (!configPath.startsWith('/src/assets/deviceconfigs/')) {
      configPath = `/src/assets/deviceconfigs/${configPath}`;
    }

    res.json({ configPath });
  } catch (error) {
    console.error('Error reading icon metadata:', error);
    res.status(500).json({ 
      error: 'Failed to read icon metadata',
      details: error.message,
      path: req.query.path
    });
  }
};
