import dotenv from 'dotenv';
import { createInterface } from 'readline';
import { McpRequest, McpResponse } from './types';
import { AzureDevOpsService } from './services/azure-devops.service';

// Load environment variables
dotenv.config();

// Initialize Azure DevOps service
const azureDevOpsService = new AzureDevOpsService();

// Define MCP tools
const tools = [
  {
    name: 'azure_devops_wiki_search',
    description: 'Search for content in Azure DevOps wiki',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        project: {
          type: 'string',
          description: 'The Azure DevOps project name (optional if specified in environment variables)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'azure_devops_code_search',
    description: 'Search for code in Azure DevOps repositories',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        project: {
          type: 'string',
          description: 'The Azure DevOps project name (optional if specified in environment variables)'
        },
        repository: {
          type: 'string',
          description: 'The repository name to search in (optional)'
        },
        fileExtensions: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'File extensions to filter results (e.g., ["js", "ts"])'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      },
      required: ['query']
    }
  }
];

// Handle MCP requests
async function handleRequest(request: McpRequest): Promise<McpResponse> {
  const toolName = request.inputs?.tool;
  const response: McpResponse = { id: request.id };

  try {
    if (request.method === 'initialize') {
      // Handle LSP initialize request
      response.outputs = {
        serverInfo: {
          name: 'Azure DevOps Search MCP Server',
          version: '1.0.0',
          vendor: 'Custom MCP Implementation'
        },
        capabilities: {
          tools,
          textDocumentSync: 1, // None
        }
      };
      // Send initialized notification
      console.log(JSON.stringify({
        method: 'initialized',
        jsonrpc: '2.0'
      }));
      return response;
    }

    if (!request.inputs) {
      throw new Error('Request inputs are required');
    }

    switch (toolName) {
      case 'azure_devops_wiki_search':
        const wikiResults = await azureDevOpsService.searchWiki({
          query: request.inputs.query,
          project: request.inputs.project,
          maxResults: request.inputs.maxResults
        });
        response.outputs = { results: wikiResults };
        break;
        
      case 'azure_devops_code_search':
        const codeResults = await azureDevOpsService.searchCode({
          query: request.inputs.query,
          project: request.inputs.project,
          repository: request.inputs.repository,
          fileExtensions: request.inputs.fileExtensions,
          maxResults: request.inputs.maxResults
        });
        response.outputs = { results: codeResults };
        break;

      default:
        if (!request.method) {
          throw new Error(`Tool not found: ${toolName}`);
        }
        // Handle other LSP methods silently
        break;
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    response.error = {
      message: error.message || 'An error occurred while processing the request',
      details: error.stack
    };
  }

  return response;
}

// Set up stdin reader
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Process each line from stdin
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line) as McpRequest;
    const response = await handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (error: any) {
    console.error('Error processing input:', error);
    const errorResponse: McpResponse = {
      id: 'error',
      error: {
        message: error.message || 'Failed to process input',
        details: error.stack
      }
    };
    console.log(JSON.stringify(errorResponse));
  }
});
