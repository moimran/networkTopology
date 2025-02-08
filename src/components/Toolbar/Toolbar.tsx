import React from 'react';
import { useReactFlow } from '@xyflow/react';
import './Toolbar.css';

interface ToolbarProps {
  showLabels: boolean;
  onToggleLabels: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  showLabels, 
  onToggleLabels 
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-item">
        <label>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={onToggleLabels}
          />
          Show Labels
        </label>
      </div>
    </div>
  );
};

export default Toolbar;
