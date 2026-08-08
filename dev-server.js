/**
 * Development Server
 * Starts both the API server and Vite dev server
 */

const { spawn } = require('child_process');
const http = require('http');

// Start the API server (same as electron/api/server.cjs)
const apiServer = require('./electron/api/server.cjs');

async function startDev() {
  console.log('🚀 Starting POS Development Server...\n');
  
  // Start API server on port 8765
  const port = await apiServer.start(8765);
  console.log(`✅ API Server running at http://localhost:${port}\n`);
  
  // Start Vite dev server
  console.log('⚡ Starting Vite dev server...');
  const vite = spawn('npx', ['vite', '--host', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true
  });
  
  vite.on('close', (code) => {
    console.log(`\nVite exited with code ${code}`);
    process.exit(code);
  });
}

startDev().catch(console.error);
