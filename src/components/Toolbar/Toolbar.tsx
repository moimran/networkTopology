import React from 'react';
import { Edge, useReactFlow } from '@xyflow/react';
import './Toolbar.css';

interface ToolbarProps {
  onEdgeTypeChange: (type: string) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
}

const edgeTypes = [
  { value: 'default', label: 'Bezier' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth Step' },
];

const Toolbar: React.FC<ToolbarProps> = ({ 
  onEdgeTypeChange, 
  showLabels, 
  onToggleLabels 
}) => {
  const { getEdges, setEdges } = useReactFlow();

  const handleEdgeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    onEdgeTypeChange(newType);

    // Update all existing edges to use the new type
    const updatedEdges = getEdges().map((edge: Edge) => ({
      ...edge,
      type: 'floating',
      animated: true,
      data: {
        ...edge.data,
        edgeType: newType,
      },
    }));
    setEdges(updatedEdges);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-item">
        <label>Edge Type:</label>
        <select onChange={handleEdgeTypeChange} defaultValue="straight">
          {edgeTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-item">
        <label>Show Labels:</label>
        <button 
          className={`toggle-button ${showLabels ? 'active' : ''}`}
          onClick={onToggleLabels}
        >
          {showLabels ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
