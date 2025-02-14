import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Share2, Layout, ChevronDown, Eye, Moon } from "lucide-react";
import { Edge, useReactFlow } from '@xyflow/react';
import './Toolbox.css';

// Custom Animated Switch Component
const AnimatedSwitch = ({ 
  isOn, 
  onToggle 
}: { 
  isOn: boolean, 
  onToggle: () => void 
}) => {
  return (
    <motion.div 
      className="animated-switch"
      data-is-on={isOn}
      onClick={onToggle}
      style={{
        display: 'flex',
        width: '40px',
        height: '20px',
        backgroundColor: isOn ? '#4CAF50' : '#cccccc',
        borderRadius: '10px',
        justifyContent: isOn ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        cursor: 'pointer',
        padding: '2px',
      }}
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRadius: '50%',
        }}
      />
    </motion.div>
  );
};

interface ToolboxProps {
  onEdgeTypeChange: (type: string) => void;
  selectedEdges: string[];
  showLabels: boolean;
  onToggleLabels: () => void;
  onLayoutChange: (layout: string) => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const edgeTypes = [
  { value: 'straight', label: 'Straight', icon: '→' },
  { value: 'bezier', label: 'Bezier', icon: '↝' },
  { value: 'step', label: 'Step', icon: '⌐' },
  { value: 'smoothstep', label: 'Smooth Step', icon: '⟿' },
];

const layoutTypes = [
  { value: 'horizontal', label: 'Horizontal Tree', icon: '⟷' },
  { value: 'vertical', label: 'Vertical Tree', icon: '⟷' },
  { value: 'radial', label: 'Radial', icon: '◎' },
  { value: 'force', label: 'Force-Directed', icon: '⚡' },
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
export default function Toolbox({ 
  onEdgeTypeChange, 
  selectedEdges, 
  showLabels, 
  onToggleLabels,
  onLayoutChange,
  onThemeToggle,
  isDarkMode
}: ToolboxProps) {
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

  const handleLayoutChange = (layout: string) => {
    console.log('Layout change:', layout);
    onLayoutChange(layout);
  };

  const getButtonClass = (type: string) => {
    const isActive = selectedEdges.length > 0 && type === currentType;
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

  const layoutButtons = (
    <div className="layout-buttons">
      {layoutTypes.map((layout) => (
        <button
          key={layout.value}
          className="layout-button"
          onClick={() => handleLayoutChange(layout.value)}
          title={layout.label}
        >
          <span className="layout-icon">{layout.icon}</span>
          <span className="layout-label">{layout.label}</span>
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
      id: 'layout-options',
      title: 'Layout Options',
      icon: <Layout size={18} />,
      content: (
        <div className="layout-options">
          <div className="layout-section">
            <h4>Layout Type</h4>
            {layoutButtons}
          </div>
          <div className="layout-section">
            <h4>Layout Settings</h4>
            <button className="toolbox-button">Auto Align</button>
            <button className="toolbox-button">Snap to Grid</button>
            <button className="toolbox-button">Reset Layout</button>
          </div>
        </div>
      )
    },
    {
      id: 'device-settings',
      title: 'Device Settings',
      icon: <Settings size={18} />,
      content: (
        <div className="settings-options">
          <div className="settings-item">
            <div className="settings-label">
              <Eye size={16} />
              <span>Show Labels</span>
              <AnimatedSwitch 
                isOn={showLabels} 
                onToggle={onToggleLabels} 
              />
            </div>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <Moon size={16} />
              <span>Dark Mode</span>
              <AnimatedSwitch 
                isOn={isDarkMode} 
                onToggle={onThemeToggle} 
              />
            </div>
          </div>
          <button className="toolbox-button">Configure Device</button>
          <button className="toolbox-button">Device Templates</button>
          <button className="toolbox-button">Interface Settings</button>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      className="toolbox-container"
      initial={{ x: 210 }}
      animate={{ 
        x: isHovered ? 0 : 210,
        height: '100vh'
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
        animate={{ height: '100%' }}
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
