# MCP Client

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue?style=for-the-badge)
![BiomeJS](https://img.shields.io/badge/BiomeJS-60A5FA?style=for-the-badge&logo=biome&logoColor=white)

A robust Model Context Protocol (MCP) client with intelligent server management capabilities. Features an MCP manager that can connect to multiple MCP servers simultaneously, with LLM integration for building sophisticated chat applications and AI-powered workflows.

## 🌟 Features

- **Multi-Server MCP Client**: Connect to and manage multiple MCP servers simultaneously
- **Intelligent Server Management**: Automatic reconnection, health monitoring, and load balancing
- **LLM Integration**: Built-in support for Google Gemini AI for natural language processing
- **Smart Query Routing**: Automatically routes queries to relevant MCP servers based on keywords
- **High-Performance API**: Built with Fastify for fast, scalable request handling
- **Robust Transport Layer**: Supports HTTP streaming and SSE with automatic fallback

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/nikilok/mcp-client.git
   cd mcp-client
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with:

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here
   MCP_HMRC_SPONSORSHIP_URL=http://localhost:8000/mcp
   MCP_DEBUG=false
   ```

4. **Start the server**
   ```bash
   bun start
   ```

The server will start at `http://localhost:3000`.

## 🧹 Code Quality & Formatting

This project uses **BiomeJS** for fast linting and code formatting. BiomeJS is a high-performance toolchain written in Rust that provides linting, formatting, and import organization.

### Available Scripts

- **`bun run lint`** - Run linting checks only
- **`bun run lint:fix`** - Run linting with automatic fixes
- **`bun run format`** - Check code formatting
- **`bun run format:fix`** - Auto-format all files
- **`bun run check`** - Run both linting and formatting checks
- **`bun run check:fix`** - Auto-fix both linting and formatting issues
- **`bun run precommit`** - Check only staged files (useful for git hooks)

### IDE Integration

The project includes VS Code settings for:

- ✅ **Format on Save**: Automatically formats code when saving
- ✅ **Auto-organize Imports**: Sorts and removes unused imports
- ✅ **Real-time Linting**: Shows errors and warnings as you type

Install the recommended BiomeJS extension for the best development experience.

### Configuration

- **`biome.json`**: Main configuration file with custom rules
- **`.vscode/settings.json`**: IDE integration settings
- **Formatting**: 2-space indentation, single quotes, semicolons

## 🔌 API Endpoints

- **POST `/chat`**: Main chat endpoint for processing queries

  ```json
  {
    "message": "Your query here - the system will route it to appropriate MCP servers"
  }
  ```

- **GET `/health`**: Health check endpoint with MCP server status
  ```json
  {
    "status": "ok",
    "timestamp": "2025-07-11T10:00:00.000Z",
    "servers": [
      {
        "name": "server1",
        "connected": true,
        "url": "http://localhost:8000/mcp"
      }
    ]
  }
  ```

## 🛠 Technology Stack

- **Runtime**: Bun (JavaScript runtime)
- **Language**: TypeScript
- **Framework**: Fastify (Web server)
- **Protocol**: Model Context Protocol (MCP)
- **AI Integration**: Google Gemini 1.5-flash
- **Transport**: HTTP Streaming / Server-Sent Events (SSE)
- **Code Quality**: BiomeJS (Linting & Formatting)

## 💡 How It Works

1. **Query Processing**: Receives user queries through the REST API
2. **LLM Analysis**: Uses Gemini AI to analyze and extract relevant information from queries
3. **Server Selection**: Intelligently routes queries to appropriate MCP servers based on keywords and context
4. **Multi-Server Coordination**: Executes queries across multiple MCP servers simultaneously
5. **Response Generation**: Combines MCP server responses with LLM processing for intelligent, context-aware replies
6. **Health Management**: Continuously monitors server health and automatically handles reconnections

## 🏗️ Architecture

- **MCP Manager**: Central orchestrator for managing multiple MCP server connections
- **MCP Client**: Individual client instances for each MCP server with automatic reconnection
- **LLM Service**: Integrated AI service for query processing and response generation
- **REST API**: High-performance Fastify server for handling client requests
- **Transport Layer**: Flexible transport with HTTP/SSE fallback mechanisms

## ⚙️ Configuration

The application supports various configuration options through environment variables:

- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for AI functionality
- `MCP_HMRC_SPONSORSHIP_URL`: URL for the HMRC MCP server (defaults to `http://localhost:8000/mcp`)
- `MCP_DEBUG`: Set to `true` to enable debug logging for MCP operations (defaults to `false`)
- `PORT`: Server port (defaults to `3000`)
- `HOST`: Server host/interface to bind to (defaults to `0.0.0.0` for cloud compatibility)

## 🤝 Contributing

Feel free to contribute to this project. Here's how you can help:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🔍 Version Information

- Current Version: 1.0.0
- Node.js: >= 14.x
- TypeScript: ^5.5.3

---

## 🔄 **Automatic Reconnection Features**

Your MCP client now includes robust automatic reconnection capabilities:

### **Key Features:**

1. **⚡ Automatic Detection**: Detects when MCP servers become unavailable
2. **🔄 Smart Reconnection**: Automatically attempts to reconnect to disconnected servers
3. **📈 Exponential Backoff**: Uses intelligent retry delays (5s → 10s → 20s → ... up to 5 minutes)
4. **📊 Status Monitoring**: Real-time visibility into connection states and retry attempts
5. **🚀 Non-Blocking**: Server continues to operate normally while reconnecting in background

### **How It Works:**

- **Monitoring**: Checks disconnected servers every 10 seconds
- **Initial Retry**: First retry after 5 seconds
- **Backoff Strategy**: Doubles delay after each failed attempt (max 5 minutes)
- **Error Detection**: Automatically detects connection failures during queries
- **Recovery**: Seamlessly resumes operations when servers come back online

### **Status Endpoints:**

- **GET `/health`**: Shows detailed connection status and reconnection information
- **Real-time monitoring**: Track retry attempts and next retry timings

### **Benefits:**

- ✅ **Resilient**: Handles temporary network issues gracefully
- ✅ **Self-healing**: Automatically recovers without manual intervention
- ✅ **Performance**: Doesn't block operations while reconnecting
- ✅ **Visibility**: Clear logging and status reporting
- ✅ **Configurable**: Easy to adjust retry intervals and timeouts

Built with ❤️ using Model Context Protocol
