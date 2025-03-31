import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from 'dotenv';
import { AzureDevOpsService } from './services/azure-devops.service.js';
import { CodeSearchInput, CodeRetrievalInput } from './types/index.js';

// Load environment variables
dotenv.config();

// Initialize Azure DevOps service
const azureDevOpsService = new AzureDevOpsService();

// Create an MCP server
const server = new McpServer({
  name: process.env.PROJECT_FRIENDLY_NAME || "Azure DevOps Search MCP Server",
  version: "1.0.0"
});

// Add Azure DevOps wiki search tool
server.tool(
  "azure_devops_wiki_search",
  `Online search for content within ${process.env.PROJECT_FRIENDLY_NAME || 'Azure DevOps'} wiki pages. Returns matching wiki pages with their titles, content snippets, paths, and URLs.`,
  {
    query: z.string().describe("The search query"),
    project: z.string().optional().describe("The Azure DevOps project name (optional if specified in environment variables)"),
    maxResults: z.number().optional().default(10).describe("Maximum number of results to return")
  },
  async (args, extra) => {
    const results = await azureDevOpsService.searchWiki({
      query: args.query,
      project: args.project,
      maxResults: args.maxResults
    });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
);

// Add Azure DevOps code search tool
server.tool(
  "azure_devops_code_search",
  `Online search for code within ${process.env.PROJECT_FRIENDLY_NAME || 'Azure DevOps'} repositories. Returns matching code snippets with file paths, repository information, and direct URLs to the code.`,
  {
    query: z.string().describe("The search query"),
    project: z.string().optional().describe("The Azure DevOps project name (optional if specified in environment variables)"),
    repository: z.string().optional().describe("The repository name to search in (optional)"),
    fileExtensions: z.array(z.string()).optional().describe("File extensions to filter results (e.g., [\"js\", \"ts\"])"),
    maxResults: z.number().optional().default(10).describe("Maximum number of results to return"),
    branch: z.string().optional().describe("The branch to search in (e.g., 'master', 'main')"),
    path: z.string().optional().describe("Path filter (e.g., '/src/**' to search in src folder)"),
    codeElements: z.array(z.enum(['class', 'function', 'variable', 'comment'])).optional().describe("Types of code elements to search for"),
    skip: z.number().optional().default(0).describe("Number of results to skip (for pagination)"),
    includeFacets: z.boolean().optional().default(true).describe("Whether to include faceted search results")
  },
  async (args, extra) => {
    // Convert the tool parameters to the format expected by the service
    const searchInput: CodeSearchInput = {
      query: args.query,
      project: args.project,
      repository: args.repository,
      fileExtensions: args.fileExtensions,
      maxResults: args.maxResults,
      branch: args.branch,
      path: args.path,
      codeElements: args.codeElements,
      skip: args.skip,
      includeFacets: args.includeFacets
    };

    const results = await azureDevOpsService.searchCode(searchInput);
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
);

// Add Azure DevOps code retrieval tool
server.tool(
  "azure_devops_code_retrieval",
  `Retrieve code from a specific file in ${process.env.PROJECT_FRIENDLY_NAME || 'Azure DevOps'} repositories. Returns the complete file content along with metadata.`,
  {
    repository: z.string().describe("The repository name containing the file"),
    path: z.string().describe("Full path to the file within the repository"),
    project: z.string().optional().describe("The Azure DevOps project name (optional if specified in environment variables)"),
    branch: z.string().optional().describe("The branch to retrieve the file from (defaults to 'main')")
  },
  async (args, extra) => {
    // Convert the tool parameters to the format expected by the service
    const retrievalInput: CodeRetrievalInput = {
      repository: args.repository,
      path: args.path,
      project: args.project,
      branch: args.branch
    };

    const result = await azureDevOpsService.retrieveCode(retrievalInput);
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
