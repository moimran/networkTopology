import React, { useEffect, useCallback } from 'react';
import { DeviceInterface } from '../../types/device';
import { logger } from '../../utils/logger';
import './InterfaceContextMenu.css';

interface InterfaceContextMenuProps {
  interfaces: DeviceInterface[];
  position: { x: number; y: number };
  onSelect: (interfaceName: string) => void;
  onClose: () => void;
}

/**
 * Context menu component for selecting device interfaces
 */
const InterfaceContextMenu: React.FC<InterfaceContextMenuProps> = ({
  interfaces,
  position,
  onSelect,
  onClose,
}) => {
  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.interface-context-menu')) {
      onClose();
    }
  }, [onClose]);

  // Add click outside listener
  useEffect(() => {
    logger.debug('Context menu mounted', { position, interfaceCount: interfaces.length });
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      logger.debug('Context menu unmounted');
    };
  }, [handleClickOutside]);

  // Handle interface selection
  const handleInterfaceSelect = useCallback((interfaceName: string) => {
    logger.debug('Interface selected', { interfaceName });
    onSelect(interfaceName);
  }, [onSelect]);

  return (
    <div
      className="interface-context-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="interface-menu-header">Select Interface</div>
      <div className="interface-menu-list">
        {interfaces.map((iface) => (
          <div
            key={iface.interfaceName}
            className="interface-menu-item"
            onClick={() => handleInterfaceSelect(iface.interfaceName)}
          >
            <span className="interface-name">{iface.interfaceName}</span>
            <span className="interface-type">({iface.interfaceType})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterfaceContextMenu;
