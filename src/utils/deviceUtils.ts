import { Position } from '@xyflow/react';
import { DeviceConfig, NetworkInterface } from '../types/device';
import { logger } from './logger';

/**
 * Calculate handle positions for device interfaces
 * Distributes handles evenly around the node based on the number of interfaces
 */
export const calculateHandlePositions = (interfaces: NetworkInterface[]) => {
  const interfaceCount = interfaces.length;
  
  // Calculate angles for each interface
  const angleStep = (2 * Math.PI) / interfaceCount;
  
  return interfaces.reduce((acc, iface, index) => {
    // Calculate angle for this interface
    const angle = index * angleStep;
    
    // Determine the closest cardinal direction (top, right, bottom, left)
    let position: Position;
    if (angle <= Math.PI / 4 || angle > 7 * Math.PI / 4) {
      position = Position.Right;
    } else if (angle <= 3 * Math.PI / 4) {
      position = Position.Bottom;
    } else if (angle <= 5 * Math.PI / 4) {
      position = Position.Left;
    } else {
      position = Position.Top;
    }
    
    acc[iface.interfaceName] = position;
    return acc;
  }, {} as Record<string, Position>);
};

/**
 * Load device configuration from a file
 */
export const loadDeviceConfig = async (configPath: string): Promise<DeviceConfig> => {
  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load device config: ${response.statusText}`);
    }
    
    const config = await response.json();
    logger.debug('Loaded device config', {
      deviceName: config.deviceName,
      interfaceCount: config.interfaces.length
    });
    
    return config;
  } catch (error) {
    logger.error('Error loading device config', error);
    throw error;
  }
};
