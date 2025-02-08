/**
 * Interface representing a network interface configuration
 */
export interface NetworkInterface {
  interfaceName: string;
  interfaceType: string;
  ipAddress?: string;
  status?: string;
}

/**
 * Interface representing a device configuration
 */
export interface DeviceConfig {
  deviceName: string;
  deviceType: string;
  interfaces: NetworkInterface[];
  status?: string;
  location?: string;
}

/**
 * Interface for device node data that extends our base node data
 */
export interface DeviceNodeData {
  config: DeviceConfig;
  label: string;
  handles: Record<string, {
    type: 'source';
    position: number;
    interface: NetworkInterface;
  }>;
}
