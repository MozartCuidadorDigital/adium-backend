import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ClientHandler from './sockets/clientHandler.js';
import totemRoutes from './routes/totemRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../voice-agent-frontend/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Totem API routes
app.use('/api/totem', totemRoutes);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  const clientHandler = new ClientHandler(ws);
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      await clientHandler.handleMessage(message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clientHandler.cleanup();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clientHandler.cleanup();
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to voice assistant'
  }));
});

// Error handling
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Voice Assistant Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/health`);
  console.log(`🎯 Totem API available at http://localhost:${PORT}/api/totem`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}); 