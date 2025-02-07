import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Share2, Layout } from "lucide-react";
import { Edge, useReactFlow } from '@xyflow/react';
import './Toolbox.css';

interface ToolboxProps {
  onEdgeTypeChange: (type: string) => void;
  selectedEdges: string[];
}

const edgeTypes = [
  { value: 'default', label: 'Bezier', icon: '↝' },
  { value: 'straight', label: 'Straight', icon: '→' },
  { value: 'step', label: 'Step', icon: '⌐' },
  { value: 'smoothstep', label: 'Smooth Step', icon: '⟿' },
];

/**
 * Toolbox Component
 * 
 * A sliding panel that contains tools and settings for the network topology.
 * Uses framer-motion for smooth animations and hover interactions.
 */
export default function Toolbox({ onEdgeTypeChange, selectedEdges }: ToolboxProps) {
  const [selectedEdgeType, setSelectedEdgeType] = useState('straight');
  const { getEdges } = useReactFlow();

  const handleEdgeTypeChange = (newType: string) => {
    setSelectedEdgeType(newType);
    onEdgeTypeChange(newType);
  };

  // Get the edge type of the first selected edge
  const selectedEdgeTypeValue = (() => {
    if (selectedEdges.length === 0) return null;
    const edges = getEdges();
    const firstSelectedEdge = edges.find(edge => edge.id === selectedEdges[0]);
    return firstSelectedEdge?.data?.edgeType || 'straight';
  })();

  return (
    <motion.div 
      className="toolbox-container"
      initial={{ x: -250 }}
      animate={{ x: -240 }}
      whileHover={{ x: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the canvas
    >
      {/* Toolbox Panel */}
      <div className="toolbox-panel">
        <div className="toolbox-header">
          <h2 className="toolbox-title">Network Tools</h2>
          <div className="toolbox-divider" />
        </div>
        
        <div className="toolbox-content">
          <div className="toolbox-section">
            <div className="toolbox-section-header">
              <h3 className="toolbox-section-title">Edge Types</h3>
              {selectedEdges.length > 0 && (
                <span className="edge-selection-info">
                  {selectedEdges.length} edge{selectedEdges.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="edge-type-buttons">
              {edgeTypes.map((type) => (
                <button
                  key={type.value}
                  className={`edge-type-button ${selectedEdgeTypeValue === type.value ? 'selected' : ''}`}
                  onClick={() => handleEdgeTypeChange(type.value)}
                  title={type.label}
                >
                  <span className="edge-type-icon">{type.icon}</span>
                  <span className="edge-type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="toolbox-divider" />

          <button className="toolbox-button">
            <Settings size={18} className="toolbox-icon" />
            <span>Device Settings</span>
          </button>
          
          <button className="toolbox-button">
            <Share2 size={18} className="toolbox-icon" />
            <span>Connection Types</span>
          </button>
          
          <button className="toolbox-button">
            <Layout size={18} className="toolbox-icon" />
            <span>Layout Options</span>
          </button>
        </div>

        <div className="toolbox-footer">
          <div className="toolbox-hint">
            Hover to expand • Click edge to select
          </div>
        </div>
      </div>
    </motion.div>
  );
}
