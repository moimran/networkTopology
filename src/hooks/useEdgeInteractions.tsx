import { useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { useEdgeStore } from '../store/edgeStore';
import { logger } from '../utils/logger';

interface UseEdgeInteractionsReturn {
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onEdgeTypeChange: (type: string) => void;
  handleToggleLabels: () => void;
}

export const useEdgeInteractions = (
  edges: Edge[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  showLabels: boolean,
  setShowLabels: React.Dispatch<React.SetStateAction<boolean>>
): UseEdgeInteractionsReturn => {
  const { setSelectedEdges, selectedEdges } = useEdgeStore();

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdges((prev) => {
      if (event.ctrlKey || event.metaKey) {
        return prev.includes(edge.id) 
          ? prev.filter(id => id !== edge.id)  // Remove if already selected
          : [...prev, edge.id];                // Add to selection
      } else {
        return [edge.id]; // Select only this edge
      }
    });
  }, [setSelectedEdges]);

  const onEdgeTypeChange = useCallback((type: string) => {
    // Only update if there are selected edges
    if (selectedEdges.length > 0) {
      logger.debug('Changing edge type:', { selectedEdges, newType: type });
      setEdges((eds) => {
        const newEdges = eds.map((edge) => {
          // Only change type for selected edges
          if (selectedEdges.includes(edge.id)) {
            logger.debug('Updating edge:', { id: edge.id, oldType: edge.data?.edgeType, newType: type });
            return {
              ...edge,
              type: 'floating',
              data: {
                ...edge.data,
                edgeType: type,
                // Preserve existing labels and interface data
                sourceInterface: edge.data?.sourceInterface,
                targetInterface: edge.data?.targetInterface,
                sourceInterfaceLabel: edge.data?.sourceInterfaceLabel,
                targetInterfaceLabel: edge.data?.targetInterfaceLabel,
                showLabels: edge.data?.showLabels,
              },
            };
          }
          // Keep other edges unchanged
          return edge;
        });
        logger.debug('Edge update complete');
        return newEdges;
      });
    }
  }, [selectedEdges, setEdges]);

  const handleToggleLabels = useCallback(() => {
    setShowLabels(prev => {
      const newShowLabels = !prev;
      // Update all existing edges with new label visibility
      const updatedEdges = edges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          showLabels: newShowLabels,
        },
      }));
      setEdges(updatedEdges);
      return newShowLabels;
    });
  }, [edges, setEdges, setShowLabels]);

  return {
    onEdgeClick,
    onEdgeTypeChange,
    handleToggleLabels,
  };
};
