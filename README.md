# Azure DevOps Search MCP Server

A Model Context Protocol (MCP) server that provides tools for searching Azure DevOps wiki and code repositories.

## Features

This MCP server provides two tools:

1. **Azure DevOps Wiki Search** - Search for content in Azure DevOps wiki pages
2. **Azure DevOps Code Search** - Search for code in Azure DevOps repositories

## Setup

### Prerequisites

- Node.js 14 or higher
- An Azure DevOps organization with access to the Wiki and Code Search APIs
- A Personal Access Token (PAT) with appropriate permissions

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

## API Usage

The server follows the Model Context Protocol (MCP) specification for tools.

### Available Endpoints

- `GET /` - Server information
- `GET /mcp/tools` - List available tools
- `POST /mcp/tools/azure_devops_wiki_search` - Execute wiki search
- `POST /mcp/tools/azure_devops_code_search` - Execute code search

### Example Requests

#### Wiki Search

```json
POST /mcp/tools/azure_devops_wiki_search
Content-Type: application/json

{
  "id": "request-123",
  "inputs": {
    "query": "deployment guide",
    "project": "MyProject",
    "maxResults": 5
  }
}
```

#### Code Search

```json
POST /mcp/tools/azure_devops_code_search
Content-Type: application/json

{
  "id": "request-456",
  "inputs": {
    "query": "function calculateTotal",
    "project": "MyProject",
    "repository": "web-application",
    "fileExtensions": ["js", "ts"],
    "maxResults": 5
  }
}
```

## License

MIT
