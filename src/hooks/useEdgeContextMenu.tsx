import { useState, useCallback } from 'react';
import { Edge } from '@xyflow/react';

interface EdgeContextMenuState {
  show: boolean;
  position: { x: number; y: number };
  edgeId: string | null;
}

interface UseEdgeContextMenuReturn {
  edgeContextMenu: EdgeContextMenuState;
  onEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void;
  handleDeleteEdge: () => void;
  closeEdgeContextMenu: () => void;
}

export const useEdgeContextMenu = (setEdges: React.Dispatch<React.SetStateAction<Edge[]>>): UseEdgeContextMenuReturn => {
  const [edgeContextMenu, setEdgeContextMenu] = useState<EdgeContextMenuState>({
    show: false,
    position: { x: 0, y: 0 },
    edgeId: null,
  });

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // Prevent default context menu
      event.preventDefault();
      event.stopPropagation();

      // Show context menu at click position
      setEdgeContextMenu({
        show: true,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        edgeId: edge.id,
      });
    },
    []
  );

  const handleDeleteEdge = useCallback(() => {
    if (edgeContextMenu.edgeId) {
      // Delete the edge
      setEdges(prevEdges => 
        prevEdges.filter(edge => edge.id !== edgeContextMenu.edgeId)
      );

      // Close the context menu
      setEdgeContextMenu(prev => ({ ...prev, show: false }));
    }
  }, [edgeContextMenu.edgeId, setEdges]);

  const closeEdgeContextMenu = useCallback(() => {
    setEdgeContextMenu({
      show: false,
      position: { x: 0, y: 0 },
      edgeId: null,
    });
  }, []);

  return {
    edgeContextMenu,
    onEdgeContextMenu,
    handleDeleteEdge,
    closeEdgeContextMenu,
  };
};
