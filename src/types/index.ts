export interface ChatRequestBody {
  message: string;
}

export interface ChatResponse {
  reply: string;
  mcpData?: any;
}

export interface MCPToolMapping {
  toolName: string;
  parameterMapping: Record<string, string>; // Maps our standard params to tool-specific params
}

export interface MCPServerConfig {
  name: string;
  url: string;
  description: string;
  keywords: string[];
  tools?: MCPToolMapping[]; // Optional: specify which tools to use and how
  defaultTool?: string; // Optional: default tool name if multiple tools available
}

export interface MCPQueryResult {
  success: boolean;
  data?: any;
  error?: string;
  serverName?: string;
  toolUsed?: string;
}

export interface ExtractedQuery {
  companyName?: string;
  originalMessage: string;
  queryType: 'company' | 'general';
  parameters?: Record<string, any>; // Generic parameters extracted from query
}
