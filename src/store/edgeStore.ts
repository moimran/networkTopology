// Import createWithEqualityFn from zustand for creating a store with custom equality checking
import { createWithEqualityFn } from 'zustand/traditional';
// Import shallow comparison function to optimize re-renders
import { shallow } from 'zustand/shallow';

/**
 * Interface defining the structure of the Edge Store
 * Manages the state of selected edges in the network topology
 */
interface EdgeStore {
  // Array to store the IDs of currently selected edges
  selectedEdges: string[];
  
  // Function to update the selected edges, supporting both direct assignment and functional updates
  setSelectedEdges: (edges: string[] | ((prev: string[]) => string[])) => void;
}

/**
 * Create a zustand store for managing edge selection state
 * 
 * @param set - Zustand state setter function
 * @returns An object with initial state and methods to update the state
 * 
 * Uses createWithEqualityFn to create a store with custom equality checking
 * The shallow comparison helps prevent unnecessary re-renders
 */
export const useEdgeStore = createWithEqualityFn<EdgeStore>((set) => ({
  // Initial state: no edges selected
  selectedEdges: [],
  
  // Method to set selected edges, supporting both direct and functional updates
  setSelectedEdges: (edges) => set((state) => ({ 
    // If edges is a function, call it with current state to get new edges
    // Otherwise, use the provided edges directly
    selectedEdges: typeof edges === 'function' ? edges(state.selectedEdges) : edges 
  })),
}), shallow);

/**
 * Helper hook to retrieve selected edges with shallow comparison
 * 
 * @returns An array of selected edge IDs, defaulting to an empty array if undefined
 * 
 * Provides a convenient way to access selected edges from the store
 * Uses shallow comparison to optimize performance and prevent unnecessary re-renders
 */
export const useSelectedEdges = () => 
  useEdgeStore((state) => state.selectedEdges ?? []);
