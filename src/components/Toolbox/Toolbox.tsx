import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Share2, Layout } from "lucide-react";
import './Toolbox.css';

/**
 * Toolbox Component
 * 
 * A sliding panel that contains tools and settings for the network topology.
 * Uses framer-motion for smooth animations and hover interactions.
 */
export default function Toolbox() {
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
    >
      {/* Toolbox Panel */}
      <div className="toolbox-panel">
        <div className="toolbox-header">
          <h2 className="toolbox-title">Network Tools</h2>
          <div className="toolbox-divider" />
        </div>
        
        <div className="toolbox-content">
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
            Hover to expand
          </div>
        </div>
      </div>
    </motion.div>
  );
}
