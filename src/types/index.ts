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

interface WikiSearchInput {
  query: string;  // This maps to searchText in the API
  project?: string;
  maxResults?: number;  // This maps to $top in the API
  skip?: number;  // Optional parameter for pagination
  includeFacets?: boolean;  // Optional parameter for including facets in response
}

interface CodeSearchInput {
  query: string;
  project?: string;
  repository?: string;
  fileExtensions?: string[];
  maxResults?: number;
  branch?: string;
  path?: string;
  codeElements?: Array<'class' | 'function' | 'variable' | 'comment'>;
  skip?: number;
  includeFacets?: boolean;
}

// New interface for code content retrieval
interface CodeRetrievalInput {
  repository: string;
  path: string;
  project?: string;
  branch?: string;
}

// New interface for code content response
interface CodeRetrievalResult {
  repository: string;
  path: string;
  content: string;
  url: string;
  fileName: string;
  size: number;
  commitId?: string;
}

// Azure DevOps specific types
export interface WikiSearchResult {
  id: string;
  title: string;
  content: string;
  path: string;
  url: string;
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

// Azure DevOps API specific types
export interface WikiSearchApiResponse {
  count: number;
  results: WikiSearchApiResult[];
  infoCode: number;
  facets: {
    Project: WikiSearchFacet[];
    [key: string]: WikiSearchFacet[];
  };
}

export interface WikiSearchApiResult {
  fileName: string;
  path: string;
  collection: {
    name: string;
  };
  project: {
    id: string;
    name: string;
    visibility: string | null;
  };
  wiki: {
    id: string;
    mappedPath: string;
    name: string;
    version: string;
  };
  contentId: string;
  hits: Array<{
    fieldReferenceName: string;
    highlights: string[];
  }>;
}

export interface WikiSearchFacet {
  name: string;
  id: string;
  resultCount: number;
}

// Azure DevOps Code Search API specific types
export interface CodeSearchApiRequest {
  searchText: string;
  $skip?: number;
  $top?: number;
  filters?: {
    Project?: string[];
    Repository?: string[];
    Path?: string[];
    Branch?: string[];
    CodeElement?: string[];
  };
  $orderBy?: Array<{
    field: string;
    sortOrder: 'ASC' | 'DESC';
  }>;
  includeFacets?: boolean;
}

export interface CodeSearchApiResponse {
  count: number;
  results: Array<{
    fileName: string;
    path: string;
    matches: {
      content?: Array<{
        charOffset: number;
        length: number;
      }>;
      fileName?: Array<{
        charOffset: number;
        length: number;
      }>;
    };
    collection: {
      name: string;
    };
    project: {
      name: string;
      id: string;
    };
    repository: {
      name: string;
      id: string;
      type: string;
    };
    versions?: Array<{
      branchName: string;
      changeId: string;
    }>;
    contentId: string;
  }>;
  infoCode: number;
  facets?: {
    Project?: Array<{
      name: string;
      id: string;
      resultCount: number;
    }>;
    Repository?: Array<{
      name: string;
      id: string;
      resultCount: number;
    }>;
    CodeElement?: Array<{
      name: string;
      id: string;
      resultCount: number;
    }>;
  };
}

export { WikiSearchInput, CodeSearchInput, CodeRetrievalInput, CodeRetrievalResult };
