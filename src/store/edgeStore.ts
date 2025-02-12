import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

interface EdgeStore {
  selectedEdges: string[];
  setSelectedEdges: (edges: string[] | ((prev: string[]) => string[])) => void;
}

export const useEdgeStore = createWithEqualityFn<EdgeStore>((set) => ({
  selectedEdges: [],
  setSelectedEdges: (edges) => set((state) => ({ 
    selectedEdges: typeof edges === 'function' ? edges(state.selectedEdges) : edges 
  })),
}), shallow);

// Helper to get selected edges with shallow comparison
export const useSelectedEdges = () => 
  useEdgeStore((state) => state.selectedEdges ?? []);
