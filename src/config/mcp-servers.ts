import type { MCPServerConfig } from '../types';

export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'hmrc-sponsorship',
    url: process.env.MCP_HMRC_SPONSORSHIP_URL || 'http://localhost:8000/mcp',
    description: 'HMRC Sponsorship List Service',
    keywords: ['sponsorship', 'hmrc', 'list', 'company', 'sponsor'],
    tools: [
      {
        toolName: 'search_company_search_get',
        parameterMapping: {
          company_name: 'company_name',
        },
      },
    ],
  },
];

export function isMCPQuery(message: string): boolean {
  // Check if message contains any keywords from any configured server
  return MCP_SERVERS.some((server) =>
    server.keywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()))
  );
}
