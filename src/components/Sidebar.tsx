import { DragEvent } from 'react';
import { logger } from '../utils/logger';
import '../styles/components/sidebar.css';

/**
 * Sidebar Component
 * 
 * Provides a draggable device node element for creating new nodes in the network topology.
 */
const Sidebar = () => {
  /**
   * Handle the start of a drag operation
   */
  const onDragStart = (event: DragEvent) => {
    logger.debug('Starting device node drag');
    event.dataTransfer.setData('application/json', '{}');
  };

  return (
    <aside className="sidebar">
      <div className="description">
        Drag and drop device to the canvas
      </div>
      
      <div
        className="dndnode device"
        onDragStart={onDragStart}
        draggable
      >
        Device Node
      </div>
    </aside>
  );
};

export default Sidebar;
