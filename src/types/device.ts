/**
 * Interface representing a network interface configuration
 */
export interface NetworkInterface {
  interfaceName: string;
  interfaceLabel: string;
  interfaceType: string;
  position?: Position;
}

/**
 * Interface representing a device configuration
 */
export interface DeviceConfig {
  iconName: string;
  deviceType: string;
  interfaces: NetworkInterface[];
}

/**
 * Interface for device node data that extends our base node data
 */
export interface DeviceNodeData {
  config: DeviceConfig;
  iconPath?: string;
  handles: Record<string, {
    type: 'source';
    position: Position;
    interface: NetworkInterface;
  }>;
  selectedInterface?: string;
}

import { Position } from '@xyflow/react';
