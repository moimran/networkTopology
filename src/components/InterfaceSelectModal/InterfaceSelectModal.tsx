import React from 'react';
import { Interface } from '../../types/device';
import './InterfaceSelectModal.css';

interface InterfaceSelectModalProps {
  interfaces: Interface[];
  position: { x: number; y: number };
  onSelect: (interfaceName: string) => void;
  onClose: () => void;
}

const InterfaceSelectModal: React.FC<InterfaceSelectModalProps> = ({
  interfaces,
  position,
  onSelect,
  onClose,
}) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(event.target.value);
  };

  return (
    <div 
      className="interface-select-modal"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
      }}
    >
      <select 
        className="interface-select"
        onChange={handleSelect}
        autoFocus
        onBlur={onClose}
      >
        <option value="">Select Interface</option>
        {interfaces.map((iface) => (
          <option key={iface.interfaceName} value={iface.interfaceName}>
            {iface.interfaceName} ({iface.interfaceType})
          </option>
        ))}
      </select>
    </div>
  );
};

export default InterfaceSelectModal;
