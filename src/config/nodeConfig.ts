/**
 * Node counter for generating unique IDs
 */
let nodeCounter = 0;

/**
 * Generate a unique node ID
 * @returns A unique string ID for a node
 */
export const generateNodeId = (): string => {
  nodeCounter += 1;
  return `node_${nodeCounter}`;
};
