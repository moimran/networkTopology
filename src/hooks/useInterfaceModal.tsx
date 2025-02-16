import { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';

interface InterfaceModalState {
  show: boolean;
  position: { x: number; y: number };
  nodeId: string | null;
}

interface UseInterfaceModalReturn {
  interfaceModal: InterfaceModalState;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  closeInterfaceModal: () => void;
  setInterfaceModal: React.Dispatch<React.SetStateAction<InterfaceModalState>>;
}

export const useInterfaceModal = (): UseInterfaceModalReturn => {
  const [interfaceModal, setInterfaceModal] = useState<InterfaceModalState>({
    show: false,
    position: { x: 0, y: 0 },
    nodeId: null,
  });

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Prevent native context menu from showing
      event.preventDefault();

      // Show interface modal at click position
      setInterfaceModal({
        show: true,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        nodeId: node.id,
      });
    },
    []
  );

  const closeInterfaceModal = useCallback(() => {
    setInterfaceModal({
      show: false,
      position: { x: 0, y: 0 },
      nodeId: null,
    });
  }, []);

  return {
    interfaceModal,
    onNodeContextMenu,
    closeInterfaceModal,
    setInterfaceModal,
  };
};
