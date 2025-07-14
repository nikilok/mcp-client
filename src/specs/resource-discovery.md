# Resource Discovery on MCP Servers

## 1.0 Problem Statement

The current implementation of discovering which MCP server to pick out of a pool of MCP servers is driven by a hardcoded list of keywords located in [`config/mcp-servers.ts`](../config/mcp-servers.ts). While this approach is simple and cost effective, it has several limitations:

- **Configuration Driven**: Requires manual maintenance of keywords and tool mappings
- **Not Generic**: Each new server requires code changes and keyword research
- **Static**: Cannot adapt when servers add new tools or capabilities
- **Limited Intelligence**: Simple keyword matching misses context and intent

We would instead like to make the config less hardcoded and more dynamic by letting the LLM decide what MCP server to use for a given message based on actual server capabilities.

## 1.1 Proposed Solution: LLM-Driven Dynamic Server Discovery

### Overview

Replace the hardcoded keyword-based approach with an intelligent system that:

1. **Discovers server capabilities at runtime** by querying each server's available tools
2. **Uses LLM analysis** to understand what each server can do based on its tools and descriptions
3. **Intelligently routes queries** by having the LLM select the most appropriate server(s)
4. **Caches capabilities** to optimize performance and reduce API calls

### Architecture Components

#### 1. ServerDiscoveryService

- **Capability Analysis**: Uses LLM to analyze server tools and generate human-readable capability descriptions
- **Smart Selection**: LLM-driven server selection based on user query intent
- **Caching Strategy**: Intelligent caching with TTL to balance performance and freshness

#### 2. Enhanced MCP Service

- **Dynamic Tool Discovery**: Queries servers at runtime to discover available tools
- **Fallback Strategy**: Returns empty server array if LLM selection fails, with informative error messaging
- **Parameter Extraction**: Uses LLM to extract relevant parameters from user queries

#### 3. Simplified Configuration

- **Minimal Config**: Servers need only name, URL, and description
- **Zero Maintenance**: No keywords or tool mappings to maintain
- **Self-Adapting**: Automatically discovers new tools when servers are updated

### System Requirements

#### R1: Configuration Simplification

The system MUST support minimal server configuration requiring only:

- Server name (identifier)
- Server URL (connection endpoint)
- Server description (human-readable purpose)

The system MUST eliminate the need for:

- Manual keyword definition
- Hardcoded tool mappings
- Parameter mapping configuration

#### R2: Runtime Discovery Process

The system MUST implement a discovery process that:

- Connects to all configured MCP servers at startup
- Queries each server for available tools via MCP protocol
- Analyzes server capabilities using LLM to generate human-readable descriptions
- Caches capability information with configurable TTL for performance

#### R3: Intelligent Query Processing

The system MUST process user queries by:

- Analyzing user messages against cached server capabilities
- Using LLM to select the most appropriate server(s) for each query
- Extracting relevant parameters from user messages automatically
- Executing queries on selected servers
- Generating coherent responses combining MCP results

### Benefits

#### ✅ Zero Configuration Discovery

- Add new servers with just name, URL, and description
- No research needed for keywords or tool mappings
- Tools and capabilities discovered automatically

#### ✅ Self-Adapting System

- Automatically detects when servers add new tools
- No config updates needed for server capability changes
- System evolves with server improvements

#### ✅ Intelligent Routing

- Context-aware server selection based on query intent
- Better handling of ambiguous or complex queries
- More accurate results through intelligent matching

#### ✅ Reduced Maintenance

- Minimal server configuration required
- No keyword mapping maintenance
- Eliminates configuration drift

#### ✅ Enhanced User Experience

- More natural query processing
- Better error handling and fallbacks
- Transparent reasoning for server selection

### Migration Strategy

#### Phase 1: Implement Core Services

- Create `ServerDiscoveryService` with LLM integration
- Add capability analysis and caching
- Implement smart server selection logic

#### Phase 2: Update MCP Integration

- Enhance `MCPService` with dynamic discovery
- Add runtime tool discovery capabilities
- Implement fallback mechanisms

#### Phase 3: Configuration Migration

- Simplify server configurations
- Remove hardcoded keywords and tools
- Update deployment and documentation

#### Phase 4: Testing and Optimization

- Test with various query types and edge cases
- Optimize caching strategies and performance
- Monitor LLM API usage and costs

### Success Metrics

- **Reduced Configuration**: Measure lines of config code eliminated
- **Improved Accuracy**: Compare query routing accuracy vs keyword approach
- **Faster Onboarding**: Time to add new servers (target: < 5 minutes)
- **System Adaptability**: Automatic detection of server capability changes

## 2.0 Functional Requirements

### 2.1 Server Discovery Requirements

#### FR1: Automatic Tool Discovery

- The system MUST query each connected MCP server to discover available tools
- The system MUST retrieve tool names, descriptions, and parameter schemas
- Tool discovery MUST occur automatically without manual configuration

#### FR2: Capability Analysis

- The system MUST use LLM analysis to understand server capabilities
- Capability descriptions MUST be generated from tool lists and server descriptions
- The system MUST cache capability analysis results to optimize performance

#### FR3: Dynamic Server Selection

- The system MUST use LLM to select appropriate servers based on user query intent
- Server selection MUST consider both query content and server capabilities
- The system MUST provide reasoning for server selection decisions

### 2.2 Configuration Requirements

#### FR4: Minimal Configuration

- Server configuration MUST require only: name, URL, and description
- The system MUST NOT require manual keyword lists
- The system MUST NOT require hardcoded tool mappings

#### FR5: Zero-Maintenance Operation

- Adding new servers MUST NOT require code changes
- Server capability changes MUST be detected automatically
- The system MUST adapt when servers add or remove tools

### 2.3 Performance Requirements

#### FR6: Caching Strategy

- Server capabilities MUST be cached with configurable TTL (default 5 minutes)
- Tool lists MUST be cached separately with configurable TTL (default 10 minutes)
- Cache invalidation MUST occur when servers become unavailable

#### FR7: Fallback Mechanisms

- The system MUST return an empty MCP server array if LLM selection fails
- The system MUST handle server connection failures gracefully
- Query processing MUST continue if some servers are unavailable
- The system MUST provide informative error messages when no servers can be selected

### 2.4 Query Processing Requirements

#### FR8: Parameter Extraction

- The system MUST extract relevant parameters from user queries using LLM
- Parameter extraction MUST handle various query formats and phrasings
- The system MUST map extracted parameters to appropriate tool schemas

#### FR9: Response Generation

- The system MUST combine results from multiple servers coherently
- Response generation MUST provide context about which servers were used
- The system MUST handle cases where no servers can answer the query
- The system MUST provide helpful error messages when LLM selection returns empty server array

## 3.0 Migration Path and Breaking Changes

### 3.1 File Changes Required

#### Modified Files:

- `src/config/mcp-servers.ts` - Simplified configuration
- `src/services/mcp.service.ts` - Add LLM-driven selection
- `src/services/llm.service.ts` - Enhanced parameter extraction
- `src/controllers/chat.controller.ts` - Remove hardcoded checks

#### New Files:

- `src/services/server-discovery.service.ts` - Core discovery logic
- `src/types/discovery.ts` - Type definitions for capabilities

### 3.2 Environment Variables

```bash
# Required for LLM-driven discovery
GEMINI_MODEL=models/gemini-1.5-flash
GEMINI_API_KEY=your_api_key

# Server discovery cache settings (optional)
DISCOVERY_CACHE_TTL=300000  # 5 minutes
DISCOVERY_MAX_RETRIES=3
```

### 3.3 Backward Compatibility

During migration, the system will:

- ✅ Support both old hardcoded and new dynamic configurations
- ✅ Return empty server array if LLM selection fails, with clear error messaging
- ✅ Maintain existing API contracts
- ✅ Preserve all current functionality while adding new capabilities

## 4.0 Performance and Cost Considerations

### 4.1 Caching Strategy

- **Capability Analysis**: Cache for 5 minutes to reduce LLM calls
- **Server Selection**: No caching (query-dependent)
- **Tool Discovery**: Cache tool lists for 10 minutes

### 4.2 LLM Usage Optimization

- **Batch Operations**: Analyze multiple servers in single LLM call
- **Prompt Engineering**: Optimized prompts for consistent JSON responses
- **Fallback Logic**: Reduce LLM dependency with smart fallbacks

### 4.3 Expected Costs

- **Capability Analysis**: ~1 LLM call per server every 5 minutes
- **Server Selection**: 1 LLM call per user query
- **Parameter Extraction**: 1 LLM call per query (as needed)

## 5.0 Testing Strategy

### 5.1 Test Cases

- Multiple servers with different capabilities
- Ambiguous queries requiring intelligent routing
- Server failure scenarios and fallback behavior
- Cache expiration and refresh logic
- Performance under load

### 5.2 Quality Metrics

- Server selection accuracy > 95%
- Response time < 2 seconds for cached capabilities
- LLM API error rate < 1%
- Zero false negatives for supported queries

### 5.3 Success Metrics

- **Reduced Configuration**: Measure lines of config code eliminated
- **Improved Accuracy**: Compare query routing accuracy vs keyword approach
- **Faster Onboarding**: Time to add new servers (target: < 5 minutes)
- **System Adaptability**: Automatic detection of server capability changes
