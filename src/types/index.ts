export interface ChatRequestBody {
  message: string;
}

// Define more specific types for MCP data
export interface MCPData {
  [key: string]: unknown;
}

export interface MCPSearchResult {
  Organisation_Name?: string;
  Town_City?: string;
  County?: string;
  fuzzy_score?: number;
}

export interface ChatResponse {
  reply: string;
  mcpData?: MCPQueryResult[];
}

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

export interface MCPQueryResult {
  success: boolean;
  data?: MCPSearchResult[] | MCPData;
  error?: string;
  serverName?: string;
  toolUsed?: string;
}

export interface ExtractedQuery {
  companyName?: string;
  originalMessage: string;
  queryType: 'company' | 'general';
  parameters?: Record<string, string | number | boolean>;
}

// Additional types for better type safety
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MCPParameter {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ReconnectionInfo {
  isReconnecting: boolean;
  attemptCount: number;
  nextRetryAt?: string;
  nextRetryIn?: number;
  lastError?: string;
}
