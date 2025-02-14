import React, { useState } from 'react';
import { 
  Cloud, 
  Circle, 
  Globe, 
  Network, 
  Monitor, 
  Router, 
  Server,
  X
} from 'lucide-react';
import './IconSidebar.css';

interface IconSidebarProps {
  iconCategories: Record<string, string[]>;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, iconPath: string) => void;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ iconCategories, onDragStart }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const getIconName = (path: string) => {
    const fileName = path.split('/').pop() || '';
    return fileName.replace(/\.[^/.]+$/, '').split('-').join(' ');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cloud':
        return <Cloud size={24} />;
      case 'dot':
        return <Circle size={24} />;
      case 'globe':
        return <Globe size={24} />;
      case 'hub':
        return <Network size={24} />;
      case 'pc':
        return <Monitor size={24} />;
      case 'router':
        return <Router size={24} />;
      case 'server':
        return <Server size={24} />;
      case 'switch':
        return <Network size={24} />;
      default:
        return <Circle size={24} />;
    }
  };

  return (
    <div className="icon-sidebar">
      <div className="icon-strip">
        {Object.keys(iconCategories).map((category) => (
          <button
            key={category}
            className={`strip-button ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            title={category.charAt(0).toUpperCase() + category.slice(1)}
          >
            {getCategoryIcon(category)}
          </button>
        ))}
      </div>
      
      {activeCategory && (
        <div className="sliding-panel">
          <div className="panel-header">
            <span className="panel-title">
              {getCategoryIcon(activeCategory)}
              {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
            </span>
            <button className="close-button" onClick={() => setActiveCategory(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="panel-content">
            {iconCategories[activeCategory].map((iconUrl) => (
              <div
                key={iconUrl}
                className="icon-item"
                draggable
                onDragStart={(e) => onDragStart(e, iconUrl)}
              >
                <img src={iconUrl} alt={getIconName(iconUrl)} />
                <span>{getIconName(iconUrl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSidebar;
