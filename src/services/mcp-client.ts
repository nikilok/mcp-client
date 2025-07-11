import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPServerConfig, MCPQueryResult } from "../types";

export class MCPClient {
  private client: Client | undefined;
  private config: MCPServerConfig;
  private isConnected = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const baseUrl = new URL(this.config.url);

    try {
      // First try HTTP streaming transport
      this.client = new Client({
        name: `${this.config.name}-streamable-client`,
        version: '1.0.0'
      });
      const transport = new StreamableHTTPClientTransport(baseUrl);
      await this.client.connect(transport);
      this.isConnected = true;
      console.log(`✅ Connected to ${this.config.name} using Streamable HTTP transport`);
    } catch (error) {
      // If that fails, try SSE transport
      console.log(`Streamable HTTP connection failed for ${this.config.name}, falling back to SSE transport`);
      this.client = new Client({
        name: `${this.config.name}-sse-client`,
        version: '1.0.0'
      });
      const sseTransport = new SSEClientTransport(baseUrl);
      await this.client.connect(sseTransport);
      this.isConnected = true;
      console.log(`✅ Connected to ${this.config.name} using SSE transport`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = undefined;
      this.isConnected = false;
      console.log(`🔌 Disconnected from ${this.config.name}`);
    }
  }

  async queryCompany(companyName: string): Promise<MCPQueryResult> {
    if (!this.isConnected || !this.client) {
      try {
        await this.connect();
      } catch (error) {
        return {
          success: false,
          error: `Failed to connect to ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`,
          serverName: this.config.name
        };
      }
    }

    try {
      console.log(`🔍 Querying ${this.config.name} for company: "${companyName}"`);
      
      // List available tools
      const tools = await this.client!.listTools();
      
      // Find the appropriate tool for company search
      const searchTool = tools.tools.find(tool => 
        tool.name.toLowerCase().includes('search') || 
        tool.name.toLowerCase().includes('company') ||
        (tool.description && tool.description.toLowerCase().includes('company'))
      );

      if (!searchTool) {
        return {
          success: false,
          error: `No suitable company search tool found in ${this.config.name}`,
          serverName: this.config.name
        };
      }

      const response = await this.client!.callTool({
        name: searchTool.name,
        arguments: {
          company_name: companyName
        }
      });

      console.log(`📥 Response from ${this.config.name}:`, response);
      
      return {
        success: true,
        data: response,
        serverName: this.config.name
      };

    } catch (error) {
      console.error(`Error querying ${this.config.name}:`, error);
      if (error instanceof Error && error.message.includes('not connected')) {
        this.isConnected = false;
        this.client = undefined;
      }
      
      return {
        success: false,
        error: `Query failed for ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`,
        serverName: this.config.name
      };
    }
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }

  isServerConnected(): boolean {
    return this.isConnected;
  }
}
