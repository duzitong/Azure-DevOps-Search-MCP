import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from 'dotenv';
import { AzureDevOpsService } from './services/azure-devops.service.js';
import { CodeSearchInput, CodeRetrievalInput, WikiPageInput } from './types/index.js';

// Load environment variables
dotenv.config();

// Initialize Azure DevOps service
const azureDevOpsService = new AzureDevOpsService();

// Create an MCP server
const server = new McpServer({
  name: process.env.PROJECT_FRIENDLY_NAME || "Azure DevOps",
  version: "1.0.0"
});

// Helper to create a tool name prefix from PROJECT_FRIENDLY_NAME
function getToolPrefix() {
  const raw = process.env.PROJECT_FRIENDLY_NAME || "Azure DevOps";
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

const toolPrefix = getToolPrefix();

// Add Azure DevOps wiki search tool
server.tool(
  `${toolPrefix}_wiki_search`,
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

// Add Azure DevOps wiki page retrieval tool
server.tool(
  `${toolPrefix}_wiki_page`,
  `Retrieve content from a specific wiki page in ${process.env.PROJECT_FRIENDLY_NAME || 'Azure DevOps'}. Returns the complete page content along with metadata and optional subpages.`,
  {
    wikiIdentifier: z.string().describe("The wiki name or ID"),
    path: z.string().describe("Path to the wiki page, including leading '/' (e.g., '/Home')"),
    project: z.string().optional().describe("The Azure DevOps project name (optional if specified in environment variables)"),
    includeContent: z.boolean().optional().default(true).describe("Whether to include the content of the page"),
    recursionLevel: z.enum(['None', 'OneLevel', 'Full']).optional().default('None').describe("The recursion level for retrieving child pages"),
    versionDescriptor: z.object({
      version: z.string().optional().describe("Git branch name, commit ID, or tag"),
      versionType: z.enum(['branch', 'commit', 'tag']).optional().describe("The type of version"),
      versionOptions: z.enum(['None', 'PreviousChange', 'FirstParent']).optional().describe("Version options")
    }).optional().describe("Version descriptor for retrieving a specific version of the wiki page")
  },
  async (args, extra) => {
    // Convert the tool parameters to the format expected by the service
    const wikiPageInput: WikiPageInput = {
      wikiIdentifier: args.wikiIdentifier,
      path: args.path,
      project: args.project,
      includeContent: args.includeContent,
      recursionLevel: args.recursionLevel,
      versionDescriptor: args.versionDescriptor
    };

    const result = await azureDevOpsService.retrieveWikiPage(wikiPageInput);
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// Add Azure DevOps code search tool
server.tool(
  `${toolPrefix}_code_search`,
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
  `${toolPrefix}_code_retrieval`,
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
