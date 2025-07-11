import Fastify from 'fastify';
import dotenv from 'dotenv';
import { MCPManager } from './services/mcp-manager';
import { ChatController } from './controllers/chat.controller';
import { MCP_SERVERS } from './config/mcp-servers';
import { ChatRequestBody } from './types';

dotenv.config();

const fastify = Fastify({ logger: true });
const mcpManager = new MCPManager();
const chatController = new ChatController(mcpManager);

// Register MCP servers
MCP_SERVERS.forEach(serverConfig => {
  mcpManager.addServer(serverConfig);
});

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
  await mcpManager.disconnectAllServers();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await mcpManager.disconnectAllServers();
  await fastify.close();
  process.exit(0);
});

// Start server
const start = async () => {
  try {
    console.log("🚀 Starting Fastify server...");
    
    await fastify.listen({
      port: 3000,
      host: '127.0.0.1',
      listenTextResolver: (addr) => {
        return `Server listening at ${addr}`;
      }
    });
    
    console.log("✅ Server is running on http://localhost:3000");
    console.log("📡 Chat endpoint available at POST http://localhost:3000/chat");
    console.log("🏥 Health check available at GET http://localhost:3000/health");
    
    // Initialize MCP servers after server is started
    console.log("🔄 Initializing MCP connections...");
    try {
      await mcpManager.initializeAllServers();
      console.log("✅ MCP servers initialized");
      
      const serverStatus = mcpManager.getServerStatus();
      serverStatus.forEach(server => {
        console.log(`📡 ${server.name}: ${server.connected ? '✅ Connected' : '❌ Disconnected'}`);
      });
    } catch (mcpError) {
      console.warn("⚠️ Warning: Some MCP servers failed to initialize:", mcpError);
      console.log("The server will continue running, but some MCP features may not work");
    }
    
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
};

start().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
