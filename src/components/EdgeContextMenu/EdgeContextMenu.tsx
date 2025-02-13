import React from 'react';
import './EdgeContextMenu.css';

interface EdgeContextMenuProps {
  show: boolean;
  position: { x: number; y: number };
  onDelete: () => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  show,
  position,
  onDelete,
}) => {
  if (!show) return null;

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="edge-context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="delete-button"
        onClick={handleDelete}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title="Delete Edge"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
        </svg>
        Delete Edge
      </button>
    </div>
  );
};

export default EdgeContextMenu;
