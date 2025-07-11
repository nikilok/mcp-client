# MCP Client

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)

A modern, intelligent chat application that combines the power of Google's Gemini AI with Model Context Protocol (MCP) to provide smart, context-aware responses about companies and organizations.

## 🌟 Features

- **AI-Powered Chat**: Integrates with Google's Gemini 2.0 for natural language processing
- **Smart Company Data**: Uses MCP to fetch accurate company information
- **Intelligent Query Processing**: Automatically extracts company names from natural language queries
- **Real-time Communication**: Built with Fastify for high-performance request handling
- **Fallback Transport**: Supports both HTTP streaming and SSE for robust connectivity

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/nikilok/mcp-client.git
   cd mcp-client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with:

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here
   MCP_HMRC_SPONSORSHIP_URL=http://localhost:8000/mcp
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The server will start at `http://localhost:3000`.

## 🔌 API Endpoints

- **POST `/chat`**: Main chat endpoint for processing queries

  ```json
  {
    "message": "Is Company X on the sponsorship list?"
  }
  ```

- **GET `/health`**: Health check endpoint
  ```json
  {
    "status": "ok",
    "timestamp": "2025-07-11T10:00:00.000Z",
    "mcpConnected": true
  }
  ```

## 🛠 Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Fastify
- **AI Integration**: Google Gemini 2.0
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: Streamable HTTP / Server-Sent Events (SSE)

## 💡 How It Works

1. User sends a query about a company
2. Gemini AI extracts the company name from the natural language query
3. MCP client fetches relevant company data
4. Gemini AI generates a human-friendly response incorporating the data
5. Response is sent back to the user

## ⚙️ Configuration

The application supports various configuration options through environment variables:

- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for AI functionality
- `MCP_HMRC_SPONSORSHIP_URL`: URL for the HMRC MCP server (defaults to `http://localhost:8000/mcp`)
- Server port: Defaults to 3000

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

Built with ❤️ using Model Context Protocol
