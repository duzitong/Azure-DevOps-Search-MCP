// MCP protocol types
export interface McpRequest {
  id: string;
  method?: string;  // LSP method
  inputs?: Record<string, any>;
  jsonrpc?: string;
}

export interface McpResponse {
  id: string;
  outputs?: Record<string, any>;
  error?: {
    message: string;
    details?: any;
  };
  jsonrpc?: string;
}

// Azure DevOps specific types
export interface WikiSearchRequest {
  query: string;
  project?: string;
  maxResults?: number;
}

export interface WikiSearchResult {
  id: string;
  title: string;
  content: string;
  path: string;
  url: string;
}

export interface CodeSearchRequest {
  query: string;
  project?: string;
  repository?: string;
  fileExtensions?: string[];
  maxResults?: number;
}

export interface CodeSearchResult {
  repository: string;
  path: string;
  fileName: string;
  content: string;
  url: string;
  matches: Array<{
    line: number;
    content: string;
  }>;
}
