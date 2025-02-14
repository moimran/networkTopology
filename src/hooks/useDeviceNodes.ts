import { useCallback, useEffect, useState } from 'react';
import { Node, XYPosition } from '@xyflow/react';
import { DeviceConfig } from '../types/device';
import { calculateHandlePositions, loadDeviceConfig } from '../utils/deviceUtils';
import { NodeIdGenerator } from '../utils/nodeUtils';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing device nodes
 */
export const useDeviceNodes = (configPath: string) => {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load device configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await loadDeviceConfig(configPath);
        logger.debug('Loaded device config', { 
          deviceName: config.deviceName,
          interfaceCount: config.interfaces.length,
          interfaces: config.interfaces 
        });
        setDeviceConfig(config);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [configPath]);

  /**
   * Create a new device node with interfaces from config
   */
  const createDeviceNode = useCallback((position: XYPosition): Node | null => {
    if (!deviceConfig) {
      logger.warn('No device configuration loaded');
      return null;
    }

    const nodeId = NodeIdGenerator.generateNodeId();

    // Calculate handle positions based on interface count
    const handlePositions = calculateHandlePositions(deviceConfig.interfaces);
    
    // Create handles for each interface
    const handles = deviceConfig.interfaces.reduce((acc, iface) => {
      acc[iface.interfaceName] = {
        type: 'source' as const,
        position: handlePositions[iface.interfaceName],
        interface: iface
      };
      return acc;
    }, {} as Record<string, any>);

    logger.debug('Creating device node handles', { 
      nodeId, 
      interfaceCount: deviceConfig.interfaces.length,
      handleCount: Object.keys(handles).length,
      handlePositions
    });

    const newNode: Node = {
      id: nodeId,
      type: 'networkNode',
      position,
      data: {
        label: deviceConfig.deviceName,
        config: deviceConfig,
        handles
      },
      draggable: true, // Enable node dragging
      selectable: true, // Enable node selection
    };

    return newNode;
  }, [deviceConfig]);

  return {
    deviceConfig,
    isLoading,
    error,
    createDeviceNode
  };
};
