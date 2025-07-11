import type { ExtractedQuery, MCPQueryResult, MCPServerConfig, ReconnectionInfo } from '../types';
import { LLMService } from './llm.service';
import { MCPClient } from './mcp-client';

type ReconnectionState = {
  serverName: string;
  lastAttempt: Date;
  attemptCount: number;
  nextRetryDelay: number;
};

export class MCPManager {
  private clients: Map<string, MCPClient> = new Map();
  private llmService: LLMService;
  private disconnectedServers: Map<string, ReconnectionState> = new Map();
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private readonly INITIAL_RETRY_DELAY = 5000; // 5 seconds
  private readonly MAX_RETRY_DELAY = 300000; // 5 minutes
  private readonly RECONNECTION_CHECK_INTERVAL = 10000; // Check every 10 seconds
  private readonly HEALTH_CHECK_INTERVAL = 30000; // Health check every 30 seconds
  private isShuttingDown = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.llmService = new LLMService();
    this.startReconnectionMonitor();
    this.startHealthMonitor();
  }

  addServer(config: MCPServerConfig): void {
    const client = new MCPClient(config);

    // Set up connection event callbacks
    client.setConnectionCallbacks({
      onDisconnect: (serverName: string) => {
        console.log(`🔴 Server ${serverName} disconnected - adding to reconnection queue`);
        this.markServerAsDisconnected(serverName);
      },
      onReconnect: (serverName: string) => {
        console.log(`🟢 Server ${serverName} reconnected - removing from reconnection queue`);
        this.disconnectedServers.delete(serverName);
      },
    });

    this.clients.set(config.name, client);
    console.log(`📝 Added MCP server: ${config.name} (${config.url})`);
  }

  async initializeAllServers(): Promise<void> {
    const connectionPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.connect();
        // Remove from disconnected list if reconnection was successful
        this.disconnectedServers.delete(client.getConfig().name);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${client.getConfig().name}:`, error);
        this.markServerAsDisconnected(client.getConfig().name);
      }
    });

    await Promise.allSettled(connectionPromises);
  }

  async disconnectAllServers(): Promise<void> {
    this.isShuttingDown = true;
    this.stopReconnectionMonitor();
    this.stopHealthMonitor();
    this.disconnectedServers.clear();

    const disconnectionPromises = Array.from(this.clients.values()).map((client) =>
      client.disconnect()
    );
    await Promise.allSettled(disconnectionPromises);
  }

  private async extractQueryInfo(message: string): Promise<ExtractedQuery> {
    const companyName = await this.llmService.extractCompanyName(message);

    return {
      companyName: companyName || undefined,
      originalMessage: message,
      queryType: companyName ? 'company' : 'general',
    };
  }

  private determineRelevantServers(message: string): MCPClient[] {
    const relevantClients: MCPClient[] = [];

    for (const client of this.clients.values()) {
      const config = client.getConfig();
      const hasRelevantKeyword = config.keywords.some((keyword) =>
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasRelevantKeyword) {
        relevantClients.push(client);
      }
    }

    // If no specific servers found, return all connected servers
    if (relevantClients.length === 0) {
      return Array.from(this.clients.values()).filter((client) => client.isServerConnected());
    }

    return relevantClients;
  }

  async queryServers(message: string): Promise<MCPQueryResult[]> {
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

    const relevantServers = this.determineRelevantServers(message);

    if (relevantServers.length === 0) {
      return [
        {
          success: false,
          error: 'No relevant MCP servers available.',
          serverName: 'server-manager',
        },
      ];
    }

    console.log(
      `🎯 Querying ${relevantServers.length} relevant server(s) for: "${extractedQuery.companyName}"`
    );

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

    const queryPromises = relevantServers.map(async (client) => {
      try {
        return await client.executeQuery(queryParameters);
      } catch (error) {
        // Mark server as disconnected if query fails due to connection issues
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('not connected') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('ECONNREFUSED')
        ) {
          this.markServerAsDisconnected(client.getConfig().name);
        }
        throw error;
      }
    });

    const results = await Promise.allSettled(queryPromises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: `Server query failed: ${result.reason}`,
          serverName: relevantServers[index].getConfig().name,
        };
      }
    });
  }

  async executeGenericQuery(
    serverName: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<MCPQueryResult> {
    const client = this.clients.get(serverName);

    if (!client) {
      return {
        success: false,
        error: `Server '${serverName}' not found`,
        serverName: serverName,
      };
    }

    // Override tool selection for this specific query
    const originalConfig = client.getConfig();
    const tempConfig = {
      ...originalConfig,
      defaultTool: toolName,
    };

    // Create a new client instance with the temporary config
    const ClientConstructor = client.constructor as new (config: MCPServerConfig) => MCPClient;
    const tempClient = new ClientConstructor(tempConfig);
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
          const tools = await client.listAvailableTools();
          toolsPerServer[serverName] = tools.map((t) => t.name) || [];
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

  getServerStatus(): Array<{
    name: string;
    connected: boolean;
    url: string;
    reconnectionInfo?: {
      isReconnecting: boolean;
      attemptCount: number;
      nextRetryIn?: number;
    };
  }> {
    return Array.from(this.clients.values()).map((client) => {
      const config = client.getConfig();
      const isConnected = client.isServerConnected();
      const reconnectionState = this.disconnectedServers.get(config.name);

      let reconnectionInfo: ReconnectionInfo | undefined;
      if (reconnectionState) {
        const now = new Date();
        const timeSinceLastAttempt = now.getTime() - reconnectionState.lastAttempt.getTime();
        const nextRetryIn = Math.max(0, reconnectionState.nextRetryDelay - timeSinceLastAttempt);

        reconnectionInfo = {
          isReconnecting: true,
          attemptCount: reconnectionState.attemptCount,
          nextRetryIn: Math.ceil(nextRetryIn / 1000),
        };
      }

      return {
        name: config.name,
        connected: isConnected,
        url: config.url,
        reconnectionInfo,
      };
    });
  }

  getReconnectionStatus(): {
    totalServers: number;
    connectedServers: number;
    disconnectedServers: number;
    reconnectionActive: boolean;
  } {
    const totalServers = this.clients.size;
    const connectedServers = Array.from(this.clients.values()).filter((client) =>
      client.isServerConnected()
    ).length;
    const disconnectedServers = this.disconnectedServers.size;
    const reconnectionActive = this.reconnectionTimer !== null && !this.isShuttingDown;

    return {
      totalServers,
      connectedServers,
      disconnectedServers,
      reconnectionActive,
    };
  }

  async generateResponse(message: string, mcpResults: MCPQueryResult[]): Promise<string> {
    const successfulResults = mcpResults.filter((result) => result.success);
    const combinedData = successfulResults.length > 0 ? successfulResults : undefined;

    return this.llmService.generateResponse(message, combinedData);
  }

  private startReconnectionMonitor(): void {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer);
    }

    this.reconnectionTimer = setInterval(() => {
      if (!this.isShuttingDown) {
        this.attemptReconnections();
      }
    }, this.RECONNECTION_CHECK_INTERVAL);

    console.log(
      `🔄 Started reconnection monitor (checking every ${this.RECONNECTION_CHECK_INTERVAL / 1000}s)`
    );
  }

  private stopReconnectionMonitor(): void {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer);
      this.reconnectionTimer = null;
      console.log(`⏹️ Stopped reconnection monitor`);
    }
  }

  private async attemptReconnections(): Promise<void> {
    if (this.disconnectedServers.size === 0) {
      return;
    }

    const now = new Date();
    const reconnectionPromises: Promise<void>[] = [];

    for (const [serverName, state] of this.disconnectedServers.entries()) {
      const timeSinceLastAttempt = now.getTime() - state.lastAttempt.getTime();

      if (timeSinceLastAttempt >= state.nextRetryDelay) {
        reconnectionPromises.push(this.attemptSingleReconnection(serverName, state));
      }
    }

    if (reconnectionPromises.length > 0) {
      console.log(`🔄 Attempting to reconnect ${reconnectionPromises.length} server(s)...`);
      await Promise.allSettled(reconnectionPromises);
    }
  }

  private async attemptSingleReconnection(
    serverName: string,
    state: ReconnectionState
  ): Promise<void> {
    const client = this.clients.get(serverName);
    if (!client) {
      this.disconnectedServers.delete(serverName);
      return;
    }

    try {
      console.log(
        `🔌 Attempting to reconnect to ${serverName} (attempt ${state.attemptCount + 1})`
      );

      await client.connect();

      // Success! Remove from disconnected list
      this.disconnectedServers.delete(serverName);
      console.log(`✅ Successfully reconnected to ${serverName}`);
    } catch (_error) {
      // Update reconnection state with exponential backoff
      const newAttemptCount = state.attemptCount + 1;
      const newDelay = Math.min(
        this.INITIAL_RETRY_DELAY * 2 ** (newAttemptCount - 1),
        this.MAX_RETRY_DELAY
      );

      this.disconnectedServers.set(serverName, {
        serverName,
        lastAttempt: new Date(),
        attemptCount: newAttemptCount,
        nextRetryDelay: newDelay,
      });

      console.log(
        `❌ Failed to reconnect to ${serverName} (attempt ${newAttemptCount}). Next attempt in ${newDelay / 1000}s`
      );
    }
  }

  private markServerAsDisconnected(serverName: string): void {
    if (!this.disconnectedServers.has(serverName)) {
      const state: ReconnectionState = {
        serverName,
        lastAttempt: new Date(),
        attemptCount: 0,
        nextRetryDelay: this.INITIAL_RETRY_DELAY,
      };

      this.disconnectedServers.set(serverName, state);
      console.log(`📋 Marked ${serverName} as disconnected. Will attempt reconnection.`);
    }
  }

  private startHealthMonitor(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      if (!this.isShuttingDown) {
        this.performHealthChecks();
      }
    }, this.HEALTH_CHECK_INTERVAL);

    console.log(`💓 Started health monitor (checking every ${this.HEALTH_CHECK_INTERVAL / 1000}s)`);
  }

  private stopHealthMonitor(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log(`⏹️ Stopped health monitor`);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const connectedClients = Array.from(this.clients.values()).filter((client) =>
      client.isServerConnected()
    );

    if (connectedClients.length === 0) {
      return;
    }

    console.log(`💓 Performing health checks on ${connectedClients.length} connected server(s)...`);

    const healthCheckPromises = connectedClients.map(async (client) => {
      try {
        const isHealthy = await client.forceHealthCheck();
        if (!isHealthy) {
          console.log(`❌ Health check failed for ${client.getConfig().name}`);
        }
      } catch (error) {
        console.log(`❌ Health check error for ${client.getConfig().name}:`, error);
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }
}
