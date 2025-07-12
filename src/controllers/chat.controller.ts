import type { FastifyReply, FastifyRequest } from 'fastify';
import { isMCPQuery } from '../config/mcp-servers';
import type { MCPService } from '../services/mcp.service';
import type { ChatRequestBody, ChatResponse, MCPQueryResult } from '../types';

export class ChatController {
  private mcpService: MCPService;

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
  }

  async handleChat(
    request: FastifyRequest<{ Body: ChatRequestBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { message } = request.body;

      if (!message) {
        reply.status(400).send({ error: 'Message is required' });
        return;
      }

      let mcpResults: MCPQueryResult[] = [];

      if (isMCPQuery(message)) {
        console.log('🧠 This seems like an MCP query, fetching data...');
        mcpResults = await this.mcpService.processQuery(message);
        console.log('📊 MCP Results received:', mcpResults);
      }

      const response = await this.mcpService.generateResponse(message, mcpResults);

      const chatResponse: ChatResponse = {
        reply: response,
        mcpData: mcpResults.length > 0 ? mcpResults : undefined,
      };

      reply.send(chatResponse);
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async handleHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const serverStatus = this.mcpService.getServerStatus();
    const connectionStats = this.mcpService.getConnectionStats();

    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mcpServers: serverStatus,
      connectionStats: connectionStats,
    });
  }
}
