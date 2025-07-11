import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { google } from "@ai-sdk/google";
import dotenv from 'dotenv';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

dotenv.config();

interface ChatRequestBody {
  message: string;
}

interface ChatResponse {
  reply: string;
  mcpData?: any;
}

const fastify = Fastify({ logger: true });

// MCP Client setup
let mcpClient: Client | undefined;

async function extractCompanyNameWithLLM(message: string): Promise<string | null> {
  const model = google("models/gemini-2.0-flash-exp");
  const response = await model.doGenerate({
    inputFormat: "messages",
    mode: { type: "regular" },
    prompt: [{
      role: "user",
      content: [{
        type: "text",
        text: `Extract just the company name from this question. Respond with ONLY the company name, nothing else:
Question: "${message}"

For example:
"Is Google on the sponsorship list?" -> "Google"
"Where is Microsoft based?" -> "Microsoft"
"Tell me about Apple's location" -> "Apple"`
      }]
    }]
  });

  const companyName = response.text?.trim();
  return companyName || null;
}

async function initializeMCPClient(): Promise<void> {
  const baseUrl = new URL('http://localhost:8000/mcp');

  try {
    // First try HTTP streaming transport
    mcpClient = new Client({
      name: 'streamable-http-client',
      version: '1.0.0'
    });
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await mcpClient.connect(transport);
    console.log("✅ Connected using Streamable HTTP transport");
  } catch (error) {
    // If that fails with a 4xx error, try the older SSE transport
    console.log("Streamable HTTP connection failed, falling back to SSE transport");
    mcpClient = new Client({
      name: 'sse-client',
      version: '1.0.0'
    });
    const sseTransport = new SSEClientTransport(baseUrl);
    await mcpClient.connect(sseTransport);
    console.log("✅ Connected using SSE transport");
  }
}

async function queryMCPServer(message: string): Promise<any> {
  if (!mcpClient) {
    console.log("MCP client not initialized, attempting to initialize...");
    try {
      await initializeMCPClient();
    } catch (error) {
      return { error: "Failed to initialize MCP client: " + (error instanceof Error ? error.message : String(error)) };
    }
  }

  try {
    // Extract company name using LLM
    console.log("🤖 Extracting company name using LLM...");
    const companyName = await extractCompanyNameWithLLM(message);
    
    if (!companyName) {
      return { error: "Could not extract a company name from the message." };
    }

    console.log(`✨ Extracted company name: "${companyName}"`);

    // List available tools
    console.log("📝 Listing available MCP tools...");
    const tools = await mcpClient!.listTools();
    console.log("Available tools:", tools);

    // Find the appropriate tool for company search
    const searchTool = tools.tools.find(tool => 
      tool.name.toLowerCase().includes('search') || 
      tool.name.toLowerCase().includes('company') ||
      (tool.description && tool.description.toLowerCase().includes('company'))
    );

    if (!searchTool) {
      return { error: "No suitable company search tool found in the MCP server" };
    }

    console.log(`🔍 Querying MCP using tool "${searchTool.name}" for company: "${companyName}"`);
    
    const response = await mcpClient!.callTool({
      name: searchTool.name,
      arguments: {
        company_name: companyName
      }
    });

    console.log("📥 MCP Response:", response);
    return response;

  } catch (error) {
    console.error("Error querying MCP server:", error);
    if (error instanceof Error && error.message.includes('not connected')) {
      mcpClient = undefined; // Reset client for next attempt
    }
    return { error: `MCP query failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

function isMCPQuery(message: string): boolean {
  const mcpKeywords = ['sponsorship', 'hmrc', 'list', 'company'];
  return mcpKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// Chat endpoint
fastify.post<{ Body: ChatRequestBody }>('/chat', async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
  try {
    const { message } = request.body;
    
    if (!message) {
      return reply.status(400).send({ error: "Message is required" });
    }

    let mcpData = null;
    
    if (isMCPQuery(message)) {
      console.log("🧠 This seems like an MCP query, fetching data...");
      mcpData = await queryMCPServer(message);
      console.log("📊 MCP Data received:", mcpData);
    }

    let promptText = message;
    if (mcpData && !mcpData.error) {
      promptText = `User question: ${message}

Based on the following data from HMRC:
${JSON.stringify(mcpData, null, 2)}

Please provide a helpful response incorporating this data.`;
    }

    const model = google("models/gemini-2.0-flash-exp");
    const response = await model.doGenerate({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [{
        role: "user",
        content: [{ type: "text", text: promptText }]
      }]
    });

    const chatResponse: ChatResponse = {
      reply: response.text || "No response generated",
      mcpData: mcpData || undefined
    };

    return reply.send(chatResponse);

  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Health check endpoint
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mcpConnected: mcpClient !== undefined
  };
});

// Start server
const start = async () => {
  try {
    console.log("🚀 Starting Fastify server...");
    
    await fastify.listen({
      port: 3000,
      listenTextResolver: (addr) => {
        return `Server listening at ${addr}`;
      }
    });
    
    console.log("✅ Server is running on http://localhost:3000");
    console.log("📡 Chat endpoint available at POST http://localhost:3000/chat");
    console.log("🏥 Health check available at GET http://localhost:3000/health");
    
    // Initialize MCP client after server is started
    console.log("🔄 Initializing MCP connection...");
    try {
      await initializeMCPClient();
      console.log("✅ MCP Client initialized successfully");
    } catch (mcpError) {
      console.warn("⚠️ Warning: MCP initialization failed:", mcpError);
      console.log("The server will continue running, but MCP features may not work");
    }
    
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
};

start().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
