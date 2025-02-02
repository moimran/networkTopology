import { DragEvent } from 'react';
import './Sidebar.css';

// Define the onDragStart handler
const onDragStart = (event: DragEvent, nodeType: string) => {
  // Set the node type as transfer data
  event.dataTransfer.setData('application/networknode', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-description">
        Drag and drop nodes to create your network topology
      </div>
      
      {/* Network Node */}
      <div
        className="network-node-item"
        onDragStart={(event: DragEvent) => onDragStart(event, 'networkNode')}
        draggable
      >
        Network Node
      </div>
      
      {/* You can add more node types here */}
    </aside>
  );
};

export default Sidebar;
