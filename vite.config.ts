import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('proxy error', err);
          });
        },
      },
    },
    middlewares: [
      async (req, res, next) => {
        if (req.url === '/api/save-config' && req.method === 'POST') {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            const data = JSON.parse(Buffer.concat(chunks).toString());
            
            // Create configs directory if it doesn't exist
            const configDir = path.join(process.cwd(), 'configs');
            if (!fs.existsSync(configDir)) {
              fs.mkdirSync(configDir, { recursive: true });
            }

            // Save the config file
            const filename = `network-config-${Date.now()}.json`;
            fs.writeFileSync(
              path.join(configDir, filename),
              JSON.stringify(data, null, 2)
            );

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, filename }));
          });
        } else {
          next();
        }
      },
    ],
  },
})
