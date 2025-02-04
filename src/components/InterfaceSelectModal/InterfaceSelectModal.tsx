import React from 'react';
import { Edge } from '@xyflow/react';
import { Interface } from '../../types/device';
import './InterfaceSelectModal.css';

interface InterfaceSelectModalProps {
  show: boolean;
  position: { x: number; y: number };
  interfaces: Interface[];
  onSelect: (interfaceName: string) => void;
  onClose: () => void;
  onDelete: () => void;
  connectedInterfaces: string[];
}

const InterfaceSelectModal: React.FC<InterfaceSelectModalProps> = ({
  show,
  position,
  interfaces,
  onSelect,
  onClose,
  onDelete,
  connectedInterfaces,
}) => {
  if (!show) return null;

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedInterface = event.target.value;
    if (selectedInterface && !connectedInterfaces.includes(selectedInterface)) {
      onSelect(selectedInterface);
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete();
  };

  return (
    <div 
      className="interface-select-modal"
      style={{ 
        position: 'fixed',
        left: position.x, 
        top: position.y 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <button 
          className="delete-button"
          onClick={handleDelete}
          title="Delete Node"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="16" 
            height="16"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
          </svg>
        </button>
      </div>
      <select 
        onChange={handleSelect}
        defaultValue=""
        className="interface-select"
        autoFocus
        onBlur={onClose}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="" disabled>Select Interface</option>
        {interfaces.map((iface) => (
          <option 
            key={iface.interfaceName} 
            value={iface.interfaceName}
            disabled={connectedInterfaces.includes(iface.interfaceName)}
          >
            {iface.interfaceName} ({iface.interfaceType}) {connectedInterfaces.includes(iface.interfaceName) ? '(Connected)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default InterfaceSelectModal;
