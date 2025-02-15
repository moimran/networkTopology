#!/usr/bin/env node

/**
 * Icon Metadata Manager
 * 
 * This script adds metadata to SVG and PNG icon files based on their directory structure.
 * It processes all icons in the assets/icons directory and adds device type information
 * derived from the parent folder name.
 * 
 * Features:
 * - Adds device type metadata to SVG files as XML attributes
 * - Adds device type metadata to PNG files as EXIF data
 * - Generates detailed report of processed files
 * - Handles errors gracefully with full error reporting
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import sharp from 'sharp';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// Path configuration
const PATHS = {
  root: dirname(fileURLToPath(import.meta.url)),
  get icons() { return join(this.root, '..', 'src', 'assets', 'icons') },
  get deviceConfigs() { return join(this.root, '..', 'src', 'assets', 'deviceconfigs') }
};

// File type configuration
const FILE_TYPES = {
  SVG: 'svg',
  PNG: 'png'
};

/**
 * Get config file path for an icon
 * @param {string} iconPath - Path to the icon file
 * @param {string} deviceType - Type of device
 * @returns {string} Path to the config file
 */
function getConfigPath(iconPath, deviceType) {
  const fileName = iconPath.split('/').pop();
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  return `${deviceType}/${baseName}.json`;
}

// Store processing results
const results = {
  processed: [],
  errors: [],
  startTime: null,
  endTime: null
};

/**
 * Result tracking utilities
 */
const ResultTracker = {
  /**
   * Track successful processing of a file
   * @param {string} filePath - Path to the processed file
   * @param {string} fileType - Type of file (SVG/PNG)
   * @param {string} deviceType - Device type metadata added
   * @param {string} configPath - Path to the config file (if applicable)
   */
  trackSuccess(filePath, fileType, deviceType, configPath = null) {
    results.processed.push({
      file: relative(PATHS.icons, filePath),
      type: fileType,
      deviceType,
      configPath
    });
  },

  /**
   * Track processing error
   * @param {string} filePath - Path to the file that had an error
   * @param {string} fileType - Type of file (SVG/PNG)
   * @param {Error} error - The error that occurred
   */
  trackError(filePath, fileType, error) {
    results.errors.push({
      file: relative(PATHS.icons, filePath),
      type: fileType,
      error: error.message
    });
  }
};

/**
 * SVG file processor
 */
const SvgProcessor = {
  /**
   * Add metadata to SVG file
   * @param {string} filePath - Path to SVG file
   * @param {string} deviceType - Device type to add as metadata
   */
  async process(filePath, deviceType) {
    try {
      const svgContent = await readFile(filePath, 'utf8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svg = doc.documentElement;
      
      // Add device type metadata
      svg.setAttribute('data-device-type', deviceType);
      
      // Add config file metadata
      const configPath = getConfigPath(filePath, deviceType);
      svg.setAttribute('data-config-path', configPath);
      
      // Serialize and save
      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(doc);
      await writeFile(filePath, updatedSvg, 'utf8');
      
      ResultTracker.trackSuccess(filePath, FILE_TYPES.SVG.toUpperCase(), deviceType, configPath);
    } catch (error) {
      ResultTracker.trackError(filePath, FILE_TYPES.SVG.toUpperCase(), error);
    }
  }
};

/**
 * PNG file processor
 */
const PngProcessor = {
  /**
   * Add metadata to PNG file
   * @param {string} filePath - Path to PNG file
   * @param {string} deviceType - Device type to add as metadata
   */
  async process(filePath, deviceType) {
    try {
      const configPath = getConfigPath(filePath, deviceType);
      const metadata = {
        deviceType,
        configPath,
        updatedAt: new Date().toISOString()
      };
      
      await sharp(filePath)
        .withMetadata({
          exif: {
            IFD0: {
              DeviceType: deviceType,
              ConfigPath: configPath
            }
          }
        })
        .toBuffer()
        .then(data => writeFile(filePath, data));
      
      ResultTracker.trackSuccess(filePath, FILE_TYPES.PNG.toUpperCase(), deviceType, configPath);
    } catch (error) {
      ResultTracker.trackError(filePath, FILE_TYPES.PNG.toUpperCase(), error);
    }
  }
};

/**
 * Report generator for processing results
 */
const ReportGenerator = {
  /**
   * Generate and print processing report
   */
  print() {
    console.log('\n=== Icon Metadata Processing Report ===\n');
    
    this._printSuccessfulOperations();
    this._printErrors();
    this._printSummary();
    
    console.log('\n=====================================');
  },

  /**
   * Print successful operations grouped by device type
   */
  _printSuccessfulOperations() {
    const byDeviceType = this._groupByDeviceType();
    
    console.log('Successfully Processed Files:');
    console.log('-----------------------------');
    Object.entries(byDeviceType).forEach(([deviceType, items]) => {
      console.log(`\nDevice Type: ${deviceType}`);
      items.forEach(item => {
        console.log(`  ${item.type.padEnd(4)} | ${item.file}`);
        if (item.configPath) {
          console.log(`        Config: ${item.configPath}`);
        }
      });
    });
  },

  /**
   * Print any errors that occurred
   */
  _printErrors() {
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      console.log('-------');
      results.errors.forEach(error => {
        console.log(`${error.type.padEnd(4)} | ${error.file}`);
        console.log(`      Error: ${error.error}`);
      });
    }
  },

  /**
   * Print summary statistics
   */
  _printSummary() {
    const byDeviceType = this._groupByDeviceType();
    const deviceTypes = Object.keys(byDeviceType);
    
    // Count files with config paths
    const filesWithConfig = results.processed.filter(item => item.configPath).length;
    
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Total files processed: ${results.processed.length + results.errors.length}`);
    console.log(`Successful: ${results.processed.length}`);
    console.log(`Failed: ${results.errors.length}`);
    console.log(`Files with config paths: ${filesWithConfig}`);
    console.log(`Device types found: ${deviceTypes.length} (${deviceTypes.join(', ')})`);
    
    if (results.startTime && results.endTime) {
      const duration = (results.endTime - results.startTime) / 1000;
      console.log(`Processing time: ${duration.toFixed(2)} seconds`);
    }
  },

  /**
   * Group processed files by device type
   * @returns {Object} Files grouped by device type
   */
  _groupByDeviceType() {
    const byDeviceType = {};
    results.processed.forEach(item => {
      byDeviceType[item.deviceType] = byDeviceType[item.deviceType] || [];
      byDeviceType[item.deviceType].push(item);
    });
    return byDeviceType;
  }
};

/**
 * Main processor for handling all icon files
 */
const IconProcessor = {
  /**
   * Process all icon files in the icons directory
   */
  async processAll() {
    try {
      results.startTime = Date.now();
      
      const files = await this._getFiles();
      
      for (const file of files) {
        const deviceType = dirname(file).split('/').pop();
        const extension = file.split('.').pop().toLowerCase();
        
        if (extension === FILE_TYPES.SVG) {
          await SvgProcessor.process(file, deviceType);
        } else if (extension === FILE_TYPES.PNG) {
          await PngProcessor.process(file, deviceType);
        }
      }
      
      results.endTime = Date.now();
    } catch (error) {
      console.error('Error processing files:', error);
    }
  },

  /**
   * Get all icon files, sorted by type and name
   * @returns {Promise<string[]>} List of file paths
   */
  async _getFiles() {
    const files = await glob(`**/*.{${FILE_TYPES.SVG},${FILE_TYPES.PNG}}`, { 
      cwd: PATHS.icons,
      absolute: true
    });
    
    return files.sort((a, b) => {
      const aExt = a.split('.').pop();
      const bExt = b.split('.').pop();
      if (aExt !== bExt) return aExt.localeCompare(bExt);
      return a.localeCompare(b);
    });
  }
};

// Main execution
console.log('Adding metadata to icon files...');
IconProcessor.processAll()
  .then(() => {
    ReportGenerator.print();
  })
  .catch(error => console.error('Error:', error));
