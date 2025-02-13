import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Device type specific interface configurations
const interfaceConfigs = {
  router: {
    prefix: ['GigabitEthernet', 'FastEthernet', 'Serial'],
    count: 8,
    types: ['ethernet', 'ethernet', 'serial']
  },
  switch: {
    prefix: ['GigabitEthernet', 'TenGigabitEthernet'],
    count: 24,
    types: ['ethernet', 'ethernet']
  },
  server: {
    prefix: ['Ethernet', 'Management'],
    count: 4,
    types: ['ethernet', 'ethernet']
  },
  pc: {
    prefix: ['Ethernet'],
    count: 2,
    types: ['ethernet']
  },
  cloud: {
    prefix: ['VirtualInterface'],
    count: 8,
    types: ['virtual']
  },
  globe: {
    prefix: ['WAN'],
    count: 4,
    types: ['wan']
  },
  hub: {
    prefix: ['Port'],
    count: 8,
    types: ['ethernet']
  },
  dot: {
    prefix: ['Connection'],
    count: 1,
    types: ['virtual']
  }
};

// Function to generate interfaces based on device type
function generateInterfaces(deviceType) {
  const config = interfaceConfigs[deviceType] || interfaceConfigs.router;
  const interfaces = [];
  
  for (let i = 0; i < config.count; i++) {
    const prefixIndex = Math.floor(i / (config.count / config.prefix.length));
    const prefix = config.prefix[prefixIndex];
    const type = config.types[prefixIndex];
    const interfaceName = `${prefix}${Math.floor(i/2)}/${i%2}`;
    const interfaceLabel = `${prefix.substring(0,2)}${Math.floor(i/2)}/${i%2}`;
    
    interfaces.push({
      interfaceName,
      interfaceLabel,
      interfaceType: type
    });
  }
  
  return interfaces;
}

// Function to create device config
function createDeviceConfig(iconPath) {
  const fileName = path.basename(iconPath);
  const iconName = fileName.replace(/\.(svg|png)$/, '');
  const deviceType = iconPath.split('/').slice(-2)[0]; // Get parent directory name
  
  const config = {
    iconName,
    deviceType,
    interfaces: generateInterfaces(deviceType)
  };
  
  const configPath = iconPath
    .replace('/icons/', '/deviceconfigs/')
    .replace(/\.(svg|png)$/, '.json');
  
  // Create directory if it doesn't exist
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write config file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Created config for: ${iconName}`);
}

// Read icon files from command line arguments
const iconFiles = process.argv.slice(2);
iconFiles.forEach(createDeviceConfig);
