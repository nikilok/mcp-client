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
    return this.executeQuery({ company_name: companyName });
  }

  async executeQuery(parameters: Record<string, any>): Promise<MCPQueryResult> {
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
      console.log(`🔍 Querying ${this.config.name} with parameters:`, parameters);
      
      // List available tools
      const tools = await this.client!.listTools();
      console.log(`📋 Available tools for ${this.config.name}:`, tools.tools.map(t => t.name));

      // Select tool to use
      const toolToUse = this.selectTool(tools.tools);
      
      if (!toolToUse) {
        return {
          success: false,
          error: `No suitable tools found in ${this.config.name}. Available tools: ${tools.tools.map(t => t.name).join(', ')}`,
          serverName: this.config.name
        };
      }

      // Map parameters if needed
      const mappedParameters = this.mapParameters(toolToUse.name, parameters);

      console.log(`🔧 Using tool "${toolToUse.name}" with parameters:`, mappedParameters);

      const response = await this.client!.callTool({
        name: toolToUse.name,
        arguments: mappedParameters
      });

    //   console.log(`📥 Response from ${this.config.name}:`, response);
      
      return {
        success: true,
        data: response,
        serverName: this.config.name,
        toolUsed: toolToUse.name
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

  private selectTool(availableTools: any[]): any | null {
    if (availableTools.length === 0) {
      return null;
    }

    // If server config specifies which tools to use, prefer those
    if (this.config.tools && this.config.tools.length > 0) {
      for (const configTool of this.config.tools) {
        const tool = availableTools.find(t => t.name === configTool.toolName);
        if (tool) {
          console.log(`🎯 Using configured tool: ${tool.name}`);
          return tool;
        }
      }
    }

    // If a default tool is specified, try to use it
    if (this.config.defaultTool) {
      const defaultTool = availableTools.find(t => t.name === this.config.defaultTool);
      if (defaultTool) {
        console.log(`🔧 Using default tool: ${defaultTool.name}`);
        return defaultTool;
      }
    }

    // Fallback: use the first available tool
    console.log(`⚡ Using first available tool: ${availableTools[0].name}`);
    return availableTools[0];
  }

  private mapParameters(toolName: string, parameters: Record<string, any>): Record<string, any> {
    // Check if we have specific parameter mapping for this tool
    if (this.config.tools) {
      const toolConfig = this.config.tools.find(t => t.toolName === toolName);
      if (toolConfig && toolConfig.parameterMapping) {
        const mappedParams: Record<string, any> = {};
        
        for (const [standardParam, toolParam] of Object.entries(toolConfig.parameterMapping)) {
          if (parameters[standardParam] !== undefined) {
            mappedParams[toolParam] = parameters[standardParam];
          }
        }
        
        // Include any parameters that don't need mapping
        for (const [key, value] of Object.entries(parameters)) {
          if (!Object.keys(toolConfig.parameterMapping).includes(key)) {
            mappedParams[key] = value;
          }
        }
        
        return mappedParams;
      }
    }

    // No mapping needed, return parameters as-is
    return parameters;
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }

  isServerConnected(): boolean {
    return this.isConnected;
  }
}
