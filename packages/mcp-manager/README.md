# @mcp-client/manager

A robust Model Context Protocol (MCP) client manager for connecting to multiple MCP servers with intelligent server management, automatic reconnection, and health monitoring.

## Features

- 🔌 **Multi-Server Management**: Connect to multiple MCP servers simultaneously
- 🔄 **Automatic Reconnection**: Intelligent reconnection with exponential backoff
- 💓 **Health Monitoring**: Continuous health checks and status reporting
- 🎯 **Smart Routing**: Route queries to relevant servers based on keywords
- 🛡️ **Error Handling**: Robust error handling and connection recovery
- ⚡ **High Performance**: Optimized for production use

## Installation

```bash
npm install @mcp-client/manager
# or
yarn add @mcp-client/manager
# or
bun add @mcp-client/manager
```

## Quick Start

```typescript
import { MCPManager } from "@mcp-client/manager";

// Create manager with configuration
const manager = new MCPManager({
  servers: [
    {
      name: "my-server",
      url: "http://localhost:8000/mcp",
      description: "My MCP Server",
      keywords: ["company", "search"],
    },
  ],
  reconnection: {
    initialRetryDelay: 5000,
    maxRetryDelay: 300000,
    checkInterval: 10000, // Check for reconnections every 10 seconds
  },
  healthCheck: {
    enabled: true,
    interval: 30000,
  },
  enableDebugging: false, // Set to true for detailed logging
});

// Initialize all servers
await manager.initializeAllServers();

// Query servers
const results = await manager.queryServers({ company_name: "Example Corp" }, [
  "company",
]);

// Get server status
const status = manager.getServerStatus();
console.log(status);
```

## API Reference

### MCPManager

#### Constructor

```typescript
new MCPManager(config?: MCPManagerConfig)
```

#### Methods

- `addServer(config: MCPServerConfig): void` - Add a new server
- `initializeAllServers(): Promise<void>` - Connect to all servers
- `disconnectAllServers(): Promise<void>` - Disconnect from all servers
- `queryServers(parameters: Record<string, unknown>, keywords?: string[]): Promise<MCPQueryResult[]>` - Query relevant servers
- `executeGenericQuery(serverName: string, toolName: string, parameters: Record<string, unknown>): Promise<MCPQueryResult>` - Execute query on specific server
- `listAllAvailableTools(): Promise<Record<string, string[]>>` - List tools from all servers
- `getServerStatus(): ServerStatus[]` - Get detailed server status
- `getConnectionStats(): ConnectionStats` - Get connection statistics

### Types

#### MCPServerConfig

```typescript
interface MCPServerConfig {
  name: string;
  url: string;
  description: string;
  keywords: string[];
  tools?: MCPToolMapping[];
  defaultTool?: string;
}
```

#### MCPManagerConfig

```typescript
interface MCPManagerConfig {
  servers: MCPServerConfig[];
  reconnection?: {
    initialRetryDelay?: number; // Initial delay before first reconnection attempt (default: 5000ms)
    maxRetryDelay?: number; // Maximum delay between reconnection attempts (default: 300000ms)
    checkInterval?: number; // How often to check for reconnections (default: 10000ms)
  };
  healthCheck?: {
    enabled?: boolean; // Enable/disable health monitoring (default: true)
    interval?: number; // Health check interval (default: 30000ms)
  };
  enableDebugging?: boolean; // Enable detailed logging (default: false)
}
```

## Examples

### Basic Usage

```typescript
import { MCPManager } from "@mcp-client/manager";

const manager = new MCPManager();

// Add servers individually
manager.addServer({
  name: "server1",
  url: "http://localhost:8001/mcp",
  description: "Server 1",
  keywords: ["data", "search"],
});

await manager.initializeAllServers();
```

### Advanced Configuration

```typescript
const manager = new MCPManager({
  servers: [
    {
      name: "primary-server",
      url: "http://localhost:8000/mcp",
      description: "Primary data server",
      keywords: ["company", "organization"],
      tools: [
        {
          toolName: "search_company",
          parameterMapping: {
            company_name: "name",
          },
        },
      ],
      defaultTool: "search_company",
    },
  ],
  reconnection: {
    initialRetryDelay: 2000,
    maxRetryDelay: 120000,
  },
  healthCheck: {
    enabled: true,
    interval: 15000,
  },
});
```

### Monitoring Server Status

```typescript
// Get detailed status
const status = manager.getServerStatus();
status.forEach((server) => {
  console.log(
    `${server.name}: ${server.connected ? "Connected" : "Disconnected"}`
  );
  if (server.reconnectionInfo) {
    console.log(
      `  Reconnecting... (attempt ${server.reconnectionInfo.attemptCount})`
    );
  }
});

// Get connection statistics
const stats = manager.getConnectionStats();
console.log(
  `${stats.connectedServers}/${stats.totalServers} servers connected`
);
```

## Debugging

Enable detailed logging to troubleshoot connection issues and monitor MCP operations:

```typescript
const manager = new MCPManager({
  servers: [...],
  enableDebugging: true, // Enables detailed console logging
});
```

When debugging is enabled, you'll see detailed logs for:

- Server connection/disconnection events
- Reconnection attempts and status
- Health check results
- Query routing and execution
- Tool selection and parameter mapping
- Transport layer operations

## License

ISC
