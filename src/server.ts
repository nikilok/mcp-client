import dotenv from 'dotenv';
import Fastify from 'fastify';
import { MCP_SERVERS } from './config/mcp-servers';
import { ChatController } from './controllers/chat.controller';
import { MCPService } from './services/mcp.service';
import type { ChatRequestBody } from './types';

dotenv.config();

const fastify = Fastify({ logger: true });
const mcpService = new MCPService(MCP_SERVERS, process.env.MCP_DEBUG === 'true');
const chatController = new ChatController(mcpService);

// Routes
fastify.post<{ Body: ChatRequestBody }>('/chat', async (request, reply) => {
  await chatController.handleChat(request, reply);
});

fastify.get('/health', async (request, reply) => {
  await chatController.handleHealth(request, reply);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await mcpService.shutdown();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await mcpService.shutdown();
  await fastify.close();
  process.exit(0);
});

// Start server
const start = async () => {
  try {
    console.log('🚀 Starting Fastify server...');

    await fastify.listen({
      port: 3000,
      host: '127.0.0.1',
      listenTextResolver: (addr) => {
        return `Server listening at ${addr}`;
      },
    });

    console.log('✅ Server is running on http://localhost:3000');
    console.log('📡 Chat endpoint available at POST http://localhost:3000/chat');
    console.log('🏥 Health check available at GET http://localhost:3000/health');

    // Initialize MCP servers after server is started
    console.log('🔄 Initializing MCP connections...');
    try {
      await mcpService.initialize();
      console.log('✅ MCP servers initialized');

      const serverStatus = mcpService.getServerStatus();
      serverStatus.forEach((server) => {
        console.log(`📡 ${server.name}: ${server.connected ? '✅ Connected' : '❌ Disconnected'}`);
      });
    } catch (mcpError) {
      console.warn('⚠️ Warning: Some MCP servers failed to initialize:', mcpError);
      console.log('The server will continue running, but some MCP features may not work');
    }
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
};

start().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
