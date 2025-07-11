import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatRequestBody, ChatResponse } from '../types/index.js';
import { MCPManager } from '../services/mcp-manager.js';
import { isMCPQuery } from '../config/mcp-servers.js';

export class ChatController {
  private mcpManager: MCPManager;

  constructor(mcpManager: MCPManager) {
    this.mcpManager = mcpManager;
  }

  async handleChat(request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply): Promise<void> {
    try {
      const { message } = request.body;
      
      if (!message) {
        reply.status(400).send({ error: "Message is required" });
        return;
      }

      let mcpResults: any[] = [];
      
      if (isMCPQuery(message)) {
        console.log("🧠 This seems like an MCP query, fetching data...");
        mcpResults = await this.mcpManager.queryServers(message);
        console.log("📊 MCP Results received:", mcpResults);
      }

      const response = await this.mcpManager.generateResponse(message, mcpResults);

      const chatResponse: ChatResponse = {
        reply: response,
        mcpData: mcpResults.length > 0 ? mcpResults : undefined
      };

      reply.send(chatResponse);

    } catch (error) {
      console.error("Error in chat endpoint:", error);
      reply.status(500).send({ error: "Internal server error" });
    }
  }

  async handleHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const serverStatus = this.mcpManager.getServerStatus();
    
    reply.send({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mcpServers: serverStatus
    });
  }
}
