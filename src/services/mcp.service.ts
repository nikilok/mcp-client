import type { MCPQueryResult, MCPServerConfig } from '@mcp-client/manager';
import { MCPManager } from '@mcp-client/manager';
import type { ExtractedQuery } from '../types';
import { LLMService } from './llm.service';

export class MCPService {
  private mcpManager: MCPManager;
  private llmService: LLMService;

  constructor(serverConfigs: MCPServerConfig[], enableDebugging = false) {
    this.mcpManager = new MCPManager({
      servers: serverConfigs,
      reconnection: {
        initialRetryDelay: 5000,
        maxRetryDelay: 300000,
      },
      healthCheck: {
        enabled: true,
        interval: 30000,
      },
      enableDebugging,
    });
    this.llmService = new LLMService();
  }

  async initialize(): Promise<void> {
    await this.mcpManager.initializeAllServers();
  }

  async shutdown(): Promise<void> {
    await this.mcpManager.disconnectAllServers();
  }

  private async extractQueryInfo(message: string): Promise<ExtractedQuery> {
    const companyName = await this.llmService.extractCompanyName(message);

    return {
      companyName: companyName || undefined,
      originalMessage: message,
      queryType: companyName ? 'company' : 'general',
    };
  }

  async processQuery(message: string): Promise<MCPQueryResult[]> {
    const extractedQuery = await this.extractQueryInfo(message);

    if (extractedQuery.queryType === 'general') {
      return [
        {
          success: false,
          error: 'Could not extract a company name from the message.',
          serverName: 'query-processor',
        },
      ];
    }

    if (!extractedQuery.companyName) {
      return [
        {
          success: false,
          error: 'No company name found in query',
          serverName: 'system',
        },
      ];
    }

    const queryParameters = {
      company_name: extractedQuery.companyName,
      ...extractedQuery.parameters,
    };

    // Extract keywords for server routing
    const keywords = message.toLowerCase().split(/\s+/);

    return this.mcpManager.queryServers(queryParameters, keywords);
  }

  async generateResponse(message: string, mcpResults: MCPQueryResult[]): Promise<string> {
    const successfulResults = mcpResults.filter((result) => result.success);
    const combinedData = successfulResults.length > 0 ? successfulResults : undefined;

    return this.llmService.generateResponse(message, combinedData);
  }

  getServerStatus() {
    return this.mcpManager.getServerStatus();
  }

  getConnectionStats() {
    return this.mcpManager.getConnectionStats();
  }

  async listAllAvailableTools() {
    return this.mcpManager.listAllAvailableTools();
  }
}
