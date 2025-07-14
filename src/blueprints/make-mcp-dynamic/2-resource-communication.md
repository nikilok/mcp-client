# Dynamic Resource Communication for MCP Servers

## 1.0 Problem Statement

The current implementation for communicating with MCP servers relies on hardcoded parameter extraction methods in [`llm.service.ts`](../services/llm.service.ts). This approach has several limitations:

- **Hardcoded Parameter Extraction**: Methods like `extractCompanyName()` are specific to individual use cases
- **Not Generic**: Each new server or tool requires custom extraction logic
- **Static Mapping**: Cannot adapt to new tools or parameter schemas automatically
- **Limited Flexibility**: Cannot handle complex parameter structures or multiple parameter types

While the resource discovery system determines _which_ MCP server to use, we still need a dynamic way to determine _how_ to communicate with the selected server using the correct input parameters.

## 1.1 Proposed Solution: LLM-Driven Dynamic Parameter Generation

### Overview

Replace the hardcoded parameter extraction approach with an intelligent system that:

1. **Analyzes MCP tool schemas** to understand required parameters for each tool
2. **Uses LLM to extract parameters** dynamically based on tool requirements
3. **Generates appropriate input structures** for any MCP server tool
4. **Validates parameter compatibility** before executing queries

### Current State Analysis

#### Hardcoded Approach Issues:

```typescript
// Current hardcoded method - not scalable
async extractCompanyName(message: string): Promise<string | null>

// What if server needs:
// - Multiple parameters?
// - Different parameter names?
// - Complex nested structures?
// - Optional vs required parameters?
```

#### Dynamic Approach Benefits:

- **Universal Parameter Extraction**: Works with any MCP server tool schema
- **Schema-Aware**: Understands parameter types, requirements, and structures
- **Self-Adapting**: Automatically works with new tools without code changes
- **Intelligent Mapping**: Maps user intent to appropriate parameter structures

## 2.0 System Requirements

### R1: Schema-Aware Parameter Extraction

The system MUST:

- Parse MCP tool schemas to understand parameter requirements
- Extract parameters dynamically based on schema definitions
- Support all JSON schema parameter types (string, number, boolean, object, array)
- Handle both required and optional parameters appropriately

### R2: Universal Parameter Generation

The system MUST:

- Generate appropriate input parameters for any MCP tool
- Map user query content to correct parameter names and types
- Handle multiple parameters in a single query
- Support complex nested parameter structures

### R3: Intelligent Parameter Mapping

The system MUST:

- Analyze user intent to determine parameter values
- Map natural language queries to structured parameters
- Handle ambiguous queries by requesting clarification or making reasonable assumptions
- Validate parameter types and formats before execution

## 3.0 Functional Requirements

### 3.1 Schema Analysis Requirements

#### FR1: Tool Schema Discovery

- The system MUST retrieve and parse tool schemas from MCP servers
- Schema parsing MUST extract parameter names, types, descriptions, and requirements
- The system MUST cache schema information for performance optimization

#### FR2: Parameter Type Support

- The system MUST support all standard JSON schema parameter types
- Complex parameter structures (objects, arrays) MUST be handled correctly
- Enum and constrained parameter values MUST be respected

### 3.2 Dynamic Extraction Requirements

#### FR3: Context-Aware Parameter Extraction

- The system MUST analyze user queries to identify potential parameter values
- Parameter extraction MUST consider the specific tool's schema requirements
- The system MUST handle queries containing multiple potential parameter values

#### FR4: Multi-Parameter Handling

- The system MUST extract multiple parameters from a single user query
- Parameter dependencies and relationships MUST be considered
- The system MUST handle cases where some parameters are missing

### 3.3 Validation and Error Handling

#### FR5: Parameter Validation

- The system MUST validate extracted parameters against tool schemas
- Type validation MUST occur before executing MCP queries
- The system MUST handle validation failures gracefully

#### FR6: Error Recovery

- The system MUST request missing required parameters from users
- Validation errors MUST provide clear feedback about what's needed
- The system MUST suggest corrections for invalid parameter values

## 4.0 Architecture Components

### 4.1 Schema Registry Service

- **Tool Schema Storage**: Cache and manage MCP tool schemas
- **Schema Parsing**: Extract parameter requirements from JSON schemas
- **Schema Validation**: Ensure schemas are complete and valid

### 4.2 Dynamic Parameter Extractor

- **LLM-Driven Extraction**: Use LLM to map queries to parameters
- **Multi-Parameter Support**: Handle complex parameter structures
- **Type Conversion**: Convert extracted values to correct parameter types

### 4.3 Parameter Validator

- **Schema Compliance**: Validate parameters against tool schemas
- **Type Checking**: Ensure parameter types match requirements
- **Completeness Validation**: Check for missing required parameters

### 4.4 Query Builder

- **Parameter Assembly**: Combine extracted parameters into query structures
- **Default Handling**: Apply default values where appropriate
- **Query Optimization**: Optimize parameter structures for MCP execution

## 5.0 Benefits

### ✅ Universal Compatibility

- Works with any MCP server without custom code
- Automatically adapts to new tools and parameter schemas
- No hardcoded parameter extraction methods needed

### ✅ Self-Adapting System

- Automatically discovers new parameter requirements
- Adapts when tools change their parameter schemas
- No maintenance needed for parameter mapping

### ✅ Enhanced User Experience

- Natural language queries work with any MCP server
- Intelligent parameter extraction from user intent
- Clear feedback when parameters are missing or invalid

### ✅ Reduced Development Overhead

- No custom extraction methods for each server
- Automatic compatibility with new MCP servers
- Simplified integration process

## 6.0 Implementation Phases

### Phase 1: Schema Registry

- Implement tool schema discovery and caching
- Build schema parsing and validation logic
- Create parameter requirement analysis

### Phase 2: Dynamic Parameter Extraction

- Replace hardcoded extraction methods with LLM-driven approach
- Implement multi-parameter extraction logic
- Add type conversion and validation

### Phase 3: Query Building

- Create dynamic query structure generation
- Implement parameter assembly and validation
- Add error handling and user feedback

### Phase 4: Integration

- Integrate with existing resource discovery system
- Update MCP service to use dynamic parameter extraction
- Remove hardcoded parameter extraction methods

## 7.0 Success Criteria

### Functional Success

- **Universal Compatibility**: System works with any MCP server without custom code
- **Parameter Accuracy**: 95%+ accuracy in parameter extraction from user queries
- **Schema Compliance**: 100% validation against tool schemas before execution

### Performance Success

- **Response Time**: Parameter extraction and validation < 1 second
- **Cache Efficiency**: Schema caching reduces lookup time by 80%
- **Error Rate**: Parameter validation errors < 5%

### Maintenance Success

- **Zero Custom Code**: No server-specific parameter extraction methods needed
- **Automatic Adaptation**: New tools work without code changes
- **Reduced Complexity**: 50%+ reduction in parameter handling code

## 8.0 Migration Strategy

### Breaking Changes

- Remove hardcoded parameter extraction methods
- Replace specific extraction logic with generic schema-driven approach
- Update all MCP service integrations

### Backward Compatibility

- Support existing parameter structures during transition
- Gradual migration from hardcoded to dynamic extraction
- Fallback mechanisms for unsupported schema types

### Testing Strategy

- Test with multiple MCP servers and tool types
- Validate parameter extraction accuracy across different query formats
- Performance testing with various schema complexities
