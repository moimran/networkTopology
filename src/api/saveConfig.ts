/**
 * API functions for saving and loading network topology configurations
 */

/**
 * Save network topology configuration to the configs folder
 * @param data Configuration data to save
 * @returns Promise that resolves when save is complete
 */
export const saveConfig = async (data: any): Promise<void> => {
  try {
    const response = await fetch('/api/save-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save config: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
};
