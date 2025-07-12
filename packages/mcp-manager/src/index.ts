// Main exports for the MCP Manager package

export { MCPClient } from './mcp-client';
export { MCPManager } from './mcp-manager';

// Export all types
export type * from './types';

// Re-export commonly used types for convenience
export type {
  ConnectionStats,
  MCPManagerConfig,
  MCPQueryResult,
  MCPServerConfig,
  ServerStatus,
} from './types';
