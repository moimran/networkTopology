/**
 * Network Topology Server
 * 
 * Main server entry point that sets up Express and routes.
 */

import express from 'express';
import cors from 'cors';
import { paths } from './config/paths.js';
import iconRoutes from './routes/iconRoutes.js';
import configRoutes from './routes/configRoutes.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(paths.projectRoot));

// Routes
app.use('/api/icon', iconRoutes);
app.use('/api/config', configRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Project root:', paths.projectRoot);
  console.log('Assets root:', paths.assets.root);
});
