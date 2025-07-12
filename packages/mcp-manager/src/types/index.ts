export type MCPData = {
  [key: string]: unknown;
};

export type MCPSearchResult = {
  Organisation_Name?: string;
  Town_City?: string;
  County?: string;
  fuzzy_score?: number;
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

export type ReconnectionState = {
  serverName: string;
  lastAttempt: Date;
  attemptCount: number;
  nextRetryDelay: number;
};

export interface MCPManagerConfig {
  servers: MCPServerConfig[];
  reconnection?: {
    initialRetryDelay?: number;
    maxRetryDelay?: number;
    checkInterval?: number;
  };
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
  };
  enableDebugging?: boolean;
}

export type ServerStatus = {
  name: string;
  connected: boolean;
  url: string;
  reconnectionInfo?: {
    isReconnecting: boolean;
    attemptCount: number;
    nextRetryIn?: number;
  };
};

export type ConnectionStats = {
  totalServers: number;
  connectedServers: number;
  disconnectedServers: number;
  reconnectionActive: boolean;
};
