import { DragEvent } from 'react';
import { logger } from '../utils/logger';
import '../styles/components/sidebar.css';

/**
 * Sidebar Component
 * 
 * Provides draggable elements for creating new nodes in the network topology.
 */
const Sidebar = () => {
  /**
   * Handle the start of a drag operation
   */
  const onDragStart = (event: DragEvent, nodeType: string) => {
    logger.debug('Starting drag operation', { nodeType });
    
    if (nodeType === 'device') {
      event.dataTransfer.setData('application/devicenode', 'true');
    } else {
      event.dataTransfer.setData('application/devicenode', 'false');
    }
  };

  return (
    <aside className="sidebar">
      <div className="description">
        Drag and drop nodes to the canvas
      </div>
      
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'default')}
        draggable
      >
        Network Node
      </div>
      
      <div
        className="dndnode device"
        onDragStart={(event) => onDragStart(event, 'device')}
        draggable
      >
        Device Node
      </div>
    </aside>
  );
};

export default Sidebar;
