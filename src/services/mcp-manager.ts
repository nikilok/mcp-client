import { MCPClient } from "./mcp-client";
import { MCPServerConfig, MCPQueryResult, ExtractedQuery } from "../types";
import { LLMService } from "./llm.service";

export class MCPManager {
  private clients: Map<string, MCPClient> = new Map();
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  addServer(config: MCPServerConfig): void {
    const client = new MCPClient(config);
    this.clients.set(config.name, client);
    console.log(`📝 Added MCP server: ${config.name} (${config.url})`);
  }

  async initializeAllServers(): Promise<void> {
    const connectionPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.connect();
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${client.getConfig().name}:`, error);
      }
    });

    await Promise.allSettled(connectionPromises);
  }

  async disconnectAllServers(): Promise<void> {
    const disconnectionPromises = Array.from(this.clients.values()).map(client => 
      client.disconnect()
    );
    await Promise.allSettled(disconnectionPromises);
  }

  private async extractQueryInfo(message: string): Promise<ExtractedQuery> {
    const companyName = await this.llmService.extractCompanyName(message);
    
    return {
      companyName: companyName || undefined,
      originalMessage: message,
      queryType: companyName ? 'company' : 'general'
    };
  }

  private determineRelevantServers(message: string): MCPClient[] {
    const relevantClients: MCPClient[] = [];
    
    for (const client of this.clients.values()) {
      const config = client.getConfig();
      const hasRelevantKeyword = config.keywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasRelevantKeyword) {
        relevantClients.push(client);
      }
    }

    // If no specific servers found, return all connected servers
    if (relevantClients.length === 0) {
      return Array.from(this.clients.values()).filter(client => 
        client.isServerConnected()
      );
    }

    return relevantClients;
  }

  async queryServers(message: string): Promise<MCPQueryResult[]> {
    const extractedQuery = await this.extractQueryInfo(message);
    
    if (extractedQuery.queryType === 'general') {
      return [{
        success: false,
        error: "Could not extract a company name from the message.",
        serverName: "query-processor"
      }];
    }

    const relevantServers = this.determineRelevantServers(message);
    
    if (relevantServers.length === 0) {
      return [{
        success: false,
        error: "No relevant MCP servers available.",
        serverName: "server-manager"
      }];
    }

    console.log(`🎯 Querying ${relevantServers.length} relevant server(s) for: "${extractedQuery.companyName}"`);

    const queryParameters = {
      company_name: extractedQuery.companyName!,
      ...extractedQuery.parameters 
    };

    const queryPromises = relevantServers.map(client =>
      client.executeQuery(queryParameters)
    );

    const results = await Promise.allSettled(queryPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: `Server query failed: ${result.reason}`,
          serverName: relevantServers[index].getConfig().name
        };
      }
    });
  }

  async executeGenericQuery(serverName: string, toolName: string, parameters: Record<string, any>): Promise<MCPQueryResult> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      return {
        success: false,
        error: `Server '${serverName}' not found`,
        serverName: serverName
      };
    }

    // Override tool selection for this specific query
    const originalConfig = client.getConfig();
    const tempConfig = {
      ...originalConfig,
      defaultTool: toolName
    };

    // Temporarily update the client config
    const tempClient = new (client.constructor as any)(tempConfig);
    await tempClient.connect();

    try {
      return await tempClient.executeQuery(parameters);
    } finally {
      await tempClient.disconnect();
    }
  }

  async listAllAvailableTools(): Promise<Record<string, string[]>> {
    const toolsPerServer: Record<string, string[]> = {};

    for (const [serverName, client] of this.clients.entries()) {
      if (client.isServerConnected()) {
        try {
          const tools = await (client as any).client?.listTools();
          toolsPerServer[serverName] = tools?.tools?.map((t: any) => t.name) || [];
        } catch (error) {
          console.warn(`Failed to list tools for ${serverName}:`, error);
          toolsPerServer[serverName] = [];
        }
      } else {
        toolsPerServer[serverName] = [];
      }
    }

    return toolsPerServer;
  }

  getServerStatus(): Array<{name: string, connected: boolean, url: string}> {
    return Array.from(this.clients.values()).map(client => {
      const config = client.getConfig();
      return {
        name: config.name,
        connected: client.isServerConnected(),
        url: config.url
      };
    });
  }

  async generateResponse(message: string, mcpResults: MCPQueryResult[]): Promise<string> {
    const successfulResults = mcpResults.filter(result => result.success);
    const combinedData = successfulResults.length > 0 ? successfulResults : undefined;
    
    return this.llmService.generateResponse(message, combinedData);
  }
}
