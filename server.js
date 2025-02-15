import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Create configs directory if it doesn't exist
const configDir = join(__dirname, 'configs');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Save config endpoint
app.post('/api/save-config', (req, res) => {
  try {
    const data = req.body;
    
    // Generate filename with timestamp
    const filename = `network-config-${Date.now()}.json`;
    const filePath = join(configDir, filename);
    
    // Save the config file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    res.json({ success: true, filename });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
