export interface ChatRequestBody {
  message: string;
}

export interface ChatResponse {
  reply: string;
  mcpData?: any;
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
  data?: any;
  error?: string;
  serverName?: string;
  toolUsed?: string;
}

export interface ExtractedQuery {
  companyName?: string;
  originalMessage: string;
  queryType: 'company' | 'general';
  parameters?: Record<string, any>; 
}
