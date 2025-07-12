// Re-export types from the MCP manager package
export type {
  ConnectionStats,
  MCPData,
  MCPManagerConfig,
  MCPQueryResult,
  MCPSearchResult,
  MCPServerConfig,
  ServerStatus,
} from '@mcp-client/manager';

// Import types for local use
import type { MCPQueryResult } from '@mcp-client/manager';

// App-specific types
export type ChatRequestBody = {
  message: string;
};

export type ChatResponse = {
  reply: string;
  mcpData?: MCPQueryResult[];
};

export type ExtractedQuery = {
  companyName?: string;
  originalMessage: string;
  queryType: 'company' | 'general';
  parameters?: Record<string, string | number | boolean>;
};
