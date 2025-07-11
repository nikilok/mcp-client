export type ChatRequestBody = {
  message: string;
};

// Define more specific types for MCP data
export type MCPData = {
  [key: string]: unknown;
};

export type MCPSearchResult = {
  Organisation_Name?: string;
  Town_City?: string;
  County?: string;
  fuzzy_score?: number;
};

export type ChatResponse = {
  reply: string;
  mcpData?: MCPQueryResult[];
};

export interface MCPToolMapping {
  toolName: string;
  parameterMapping: Record<string, string>;
}

export interface MCPServerConfig {
  name: string;
  url: string;
  description: string;
  keywords: string[];
  tools?: MCPToolMapping[];
  defaultTool?: string;
}

export type MCPQueryResult = {
  success: boolean;
  data?: MCPSearchResult[] | MCPData;
  error?: string;
  serverName?: string;
  toolUsed?: string;
};

export type ExtractedQuery = {
  companyName?: string;
  originalMessage: string;
  queryType: 'company' | 'general';
  parameters?: Record<string, string | number | boolean>;
};

// Additional types for better type safety
export type MCPTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type MCPParameter = {
  [key: string]: string | number | boolean | null | undefined;
};

export type ReconnectionInfo = {
  isReconnecting: boolean;
  attemptCount: number;
  nextRetryAt?: string;
  nextRetryIn?: number;
  lastError?: string;
};
