# Azure DevOps Search MCP Server

A Model Context Protocol (MCP) server that provides tools for searching Azure DevOps wiki and code repositories.

## Features

This MCP server provides two tools:

1. **Azure DevOps Wiki Search** - Search for content in Azure DevOps wiki pages
2. **Azure DevOps Code Search** - Search for code in Azure DevOps repositories with support for:
   - File type filtering
   - Path-based search
   - Code element search (classes, functions, variables)
   - Branch-specific searches
   - Repository filtering

## Setup

### Prerequisites

- Node.js 16 or higher
- An Azure DevOps organization with access to the Wiki and Code Search APIs
- A Personal Access Token (PAT) with the following permissions:
  - Code (Read)
  - Wiki (Read)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/azure-devops-search-mcp.git
   cd azure-devops-search-mcp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   
   Copy the `.env.example` file to `.env` and update with your Azure DevOps details:
   ```
   AZURE_DEVOPS_ORG_URL=https://dev.azure.com/your-organization
   AZURE_DEVOPS_PAT=your-personal-access-token
   AZURE_DEVOPS_PROJECT=your-project-name
   ```

4. Build and start the server:
   ```
   npm run build
   npm start
   ```

   For development with hot-reload:
   ```
   npm run dev
   ```

## API Usage

The server implements the Model Context Protocol (MCP) specification version 1.8.0 for tools.

### Tool Parameters

#### Wiki Search
- `query` (required): The search query
- `project` (optional): The Azure DevOps project name
- `maxResults` (optional): Maximum number of results to return (default: 10)

#### Code Search
- `query` (required): The search query
- `project` (optional): The Azure DevOps project name
- `repository` (optional): The repository name to search in
- `branch` (optional): The branch to search in
- `fileExtensions` (optional): Array of file extensions to filter results
- `path` (optional): Path filter within repositories
- `codeElements` (optional): Types of code elements to search for (class, function, variable, comment)
- `maxResults` (optional): Maximum number of results to return (default: 10)

## Dependencies

- @modelcontextprotocol/sdk: ^1.8.0
- azure-devops-node-api: ^14.1.0
- axios: ^1.8.4
- dotenv: ^16.0.0
- zod: ^3.24.2

## License

MIT
