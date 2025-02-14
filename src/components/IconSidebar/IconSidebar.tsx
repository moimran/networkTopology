import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Cloud, 
  Circle, 
  Globe, 
  Network, 
  Monitor, 
  Router, 
  Server, 

} from 'lucide-react';
import './IconSidebar.css';

interface IconSidebarProps {
  iconCategories: Record<string, string[]>;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, iconPath: string) => void;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ iconCategories, onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getIconName = (path: string) => {
    const fileName = path.split('/').pop() || '';
    return fileName.replace(/\.[^/.]+$/, '').split('-').join(' ');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cloud':
        return <Cloud size={18} />;
      case 'dot':
        return <Circle size={18} />;
      case 'globe':
        return <Globe size={18} />;
      case 'hub':
        return <Network size={18} />;
      case 'pc':
        return <Monitor size={18} />;
      case 'router':
        return <Router size={18} />;
      case 'server':
        return <Server size={18} />;
      case 'switch':
        return <Network size={18} />;
    }
  };

  return (
    <div className="icon-sidebar">
      <div className="icon-panel">
        <div className="icon-header">
          <h2 className="icon-title">N</h2>
        </div>
        <div className="icon-content">
          {Object.entries(iconCategories).map(([category, icons]) => (
            <div key={category} className="icon-category">
              <button
                className="icon-category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="category-title">
                  {getCategoryIcon(category)}
                  <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </span>
                <span className={`category-arrow ${expandedCategories[category] ? 'expanded' : ''}`}>
                  {expandedCategories[category] ? (
                    <ChevronUp size={18} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={18} strokeWidth={2} />
                  )}
                </span>
              </button>
              {expandedCategories[category] && (
                <div className="icon-category-content">
                  {icons.map((iconUrl) => (
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
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconSidebar;
