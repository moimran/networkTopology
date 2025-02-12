import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Share2, Layout, ChevronDown } from "lucide-react";
import { Edge, useReactFlow } from '@xyflow/react';
import './Toolbox.css';

interface ToolboxProps {
  onEdgeTypeChange: (type: string) => void;
  selectedEdges: string[];
}

const edgeTypes = [
  { value: 'straight', label: 'Straight', icon: '→' },
  { value: 'bezier', label: 'Bezier', icon: '↝' },
  { value: 'step', label: 'Step', icon: '⌐' },
  { value: 'smoothstep', label: 'Smooth Step', icon: '⟿' },
];

interface ToolboxSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Toolbox Component
 * 
 * A sliding panel that contains tools and settings for the network topology.
 * Uses framer-motion for smooth animations and hover interactions.
 */
export default function Toolbox({ onEdgeTypeChange, selectedEdges }: ToolboxProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentType, setCurrentType] = useState<string | null>(null);
  const { getEdges } = useReactFlow();

  // Reset expanded section when mouse leaves
  useEffect(() => {
    if (!isHovered) {
      setExpandedSection(null);
    }
  }, [isHovered]);

  // Update current type when selection changes
  useEffect(() => {
    if (selectedEdges.length > 0) {
      const edges = getEdges();
      const selectedEdge = edges.find(edge => edge.id === selectedEdges[0]);
      const newType = selectedEdge?.data?.edgeType || null;
      console.log('Selection changed:', { selectedEdges, currentType: newType });
      setCurrentType(newType);
    } else {
      setCurrentType(null);
    }
  }, [selectedEdges, getEdges]);

  const handleEdgeTypeChange = (type: string) => {
    console.log('Edge type change:', { from: currentType, to: type });
    setCurrentType(type);
    onEdgeTypeChange(type);
  };

  const getButtonClass = (type: string) => {
    const isActive = selectedEdges.length > 0 && type === currentType;
    console.log('Button class:', { type, currentType, isActive });
    return isActive ? 'active' : '';
  };

  const edgeTypeButtons = (
    <div className="edge-type-buttons">
      {edgeTypes.map((type) => (
        <button
          key={type.value}
          className={getButtonClass(type.value)}
          onClick={() => handleEdgeTypeChange(type.value)}
          title={type.label}
        >
          {type.icon}
        </button>
      ))}
    </div>
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const sections: ToolboxSection[] = [
    {
      id: 'edge-types',
      title: 'Edge Types',
      icon: <Share2 size={18} />,
      content: edgeTypeButtons
    },
    {
      id: 'device-settings',
      title: 'Device Settings',
      icon: <Settings size={18} />,
      content: (
        <div className="settings-options">
          <button className="toolbox-button">Configure Device</button>
          <button className="toolbox-button">Device Templates</button>
          <button className="toolbox-button">Interface Settings</button>
        </div>
      )
    },
    {
      id: 'layout-options',
      title: 'Layout Options',
      icon: <Layout size={18} />,
      content: (
        <div className="layout-options">
          <button className="toolbox-button">Auto Layout</button>
          <button className="toolbox-button">Grid Layout</button>
          <button className="toolbox-button">Hierarchical</button>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      className="toolbox-container"
      initial={{ x: -250 }}
      animate={{ 
        x: isHovered ? 0 : -240,
        height: 'auto'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        className="toolbox-panel"
        animate={{ height: 'auto' }}
        transition={{ duration: 0.2 }}
      >
        <div className="toolbox-header">
          <h2 className="toolbox-title">Network Tools</h2>
          <div className="toolbox-divider" />
        </div>
        
        <div className="toolbox-content">
          {sections.map((section) => (
            <div key={section.id} className="toolbox-section">
              <motion.button 
                className="section-header"
                onClick={() => toggleSection(section.id)}
                animate={{ 
                  paddingRight: isHovered ? "10px" : "0px",
                  paddingLeft: isHovered ? "10px" : "0px",
                  justifyContent: isHovered ? "space-between" : "center",
                  width: isHovered ? "100%" : "40px",
                }}
                transition={{ duration: 0.2 }}
              >
                <div className={`section-title ${!isHovered ? 'icon-only' : ''}`}>
                  <span className="section-icon">{section.icon}</span>
                  {isHovered && <span>{section.title}</span>}
                </div>
                {isHovered && (
                  <motion.div 
                    className="section-chevron"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      rotate: expandedSection === section.id ? 180 : 0 
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                )}
              </motion.button>

              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="section-content"
                  >
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="toolbox-divider" />
            </div>
          ))}
        </div>

        <div className="toolbox-footer">
          <div className="toolbox-hint">
            Hover to expand • Click section to open
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
