import * as azdev from 'azure-devops-node-api';
import axios from 'axios';
import {
  WikiSearchInput,
  CodeSearchInput,
  WikiSearchResult,
  CodeSearchResult,
  WikiSearchApiResponse,
  WikiSearchApiResult,
  CodeSearchApiRequest,
  CodeSearchApiResponse,
  CodeRetrievalInput,
  CodeRetrievalResult
} from '../types/index.js';
import { SearchLogger } from './logging/search-logger.service.js';

export class AzureDevOpsService {
  private orgUrl: string;
  private searchUrl: string;
  private token: string;
  private project: string;
  private connection: azdev.WebApi;
  private logger: SearchLogger;

  constructor() {
    this.orgUrl = process.env.AZURE_DEVOPS_ORG_URL || '';
    this.searchUrl = this.orgUrl.replace('dev.azure.com', 'almsearch.dev.azure.com');
    this.token = process.env.AZURE_DEVOPS_PAT || '';
    this.project = process.env.AZURE_DEVOPS_PROJECT || '';
    this.logger = new SearchLogger();

    if (!this.orgUrl || !this.token) {
      throw new Error('Azure DevOps organization URL and personal access token are required');
    }

    // Initialize the Azure DevOps connection
    const authHandler = azdev.getPersonalAccessTokenHandler(this.token);
    this.connection = new azdev.WebApi(this.orgUrl, authHandler);
  }

  /**
   * Search for content in Azure DevOps wiki
   */
  async searchWiki(request: WikiSearchInput): Promise<WikiSearchResult[]> {
    try {
      // Log the search request
      await this.logger.logWikiSearch(request);

      const projectName = request.project || this.project;
      const maxResults = request.maxResults || 10;

      if (!projectName) {
        throw new Error('Project name is required for wiki search');
      }

      // Using Azure DevOps REST API for wiki search
      const url = `${this.searchUrl}/${projectName}/_apis/search/wikisearchresults?api-version=7.1`;
      const response = await axios.post<WikiSearchApiResponse>(
        url,
        {
          searchText: request.query,
          $skip: request.skip || 0,
          $top: maxResults,
          filters: {
            Project: projectName ? [projectName] : undefined
          },
          $orderBy: null,
          includeFacets: request.includeFacets ?? true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
          }
        }
      );

      // Transform the response into WikiSearchResult[]
      return response.data.results.map((item: WikiSearchApiResult) => {
        // Extract content from hits if available
        const contentHit = item.hits.find((hit: { fieldReferenceName: string; highlights: string[] }) =>
          hit.fieldReferenceName === 'content'
        );
        const content = contentHit ? this.stripHighlightTags(contentHit.highlights[0]) : '';

        return {
          id: item.contentId,
          title: item.fileName,
          content,
          path: item.path,
          url: `${this.orgUrl}/${projectName}/_wiki/wikis/${item.collection.name}${item.path}`
        };
      });
    } catch (error) {
      await this.logger.logError(error);
      
      // Enhanced error handling to include HTTP status code and error details
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.message;
        throw new Error(`Wiki search failed with status ${statusCode}: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  private stripHighlightTags(text: string): string {
    return text.replace(/<highlighthit>/g, '').replace(/<\/highlighthit>/g, '');
  }

  /**
   * Search for code in Azure DevOps repositories
   */
  async searchCode(request: CodeSearchInput): Promise<CodeSearchResult[]> {
    try {
      // Log the search request
      await this.logger.logCodeSearch(request);

      const projectName = request.project || this.project;
      const maxResults = request.maxResults || 10;

      if (!projectName) {
        throw new Error('Project name is required for code search');
      }

      // Using Azure DevOps REST API for code search
      const url = `${this.searchUrl}/_apis/search/codesearchresults?api-version=7.1`;

      // Build the API request body according to the API specification
      const requestBody: CodeSearchApiRequest = {
        searchText: request.query,
        $skip: request.skip || 0,
        $top: maxResults,
        filters: {
          Project: [projectName]
        },
        includeFacets: request.includeFacets ?? true,
        $orderBy: [{
          field: 'filename',
          sortOrder: 'ASC'
        }]
      };

      // Add repository filter if specified
      if (request.repository) {
        requestBody.filters = {
          ...requestBody.filters,
          Repository: [request.repository]
        };
      }

      // Add branch filter if specified
      if (request.branch) {
        requestBody.filters = {
          ...requestBody.filters,
          Branch: [request.branch]
        };
      }

      // Add path filter if specified
      if (request.path) {
        requestBody.filters = {
          ...requestBody.filters,
          Path: [request.path]
        };
      }
      // Add file extension filter if specified
      else if (request.fileExtensions && request.fileExtensions.length > 0) {
        requestBody.filters = {
          ...requestBody.filters,
          Path: request.fileExtensions.map(ext => `**/*.${ext}`)
        };
      }

      // Add code element filter if specified
      if (request.codeElements && request.codeElements.length > 0) {
        requestBody.filters = {
          ...requestBody.filters,
          CodeElement: request.codeElements
        };
      }

      const response = await axios.post<CodeSearchApiResponse>(
        url,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
          }
        }
      );

      // Transform the API response into CodeSearchResult[]
      return response.data.results.map((item: CodeSearchApiResponse['results'][0]) => {
        // Add proper null checks for matches
        const contentMatches = item.matches?.content || [];
        const matches = contentMatches.map((match) => ({
          line: 0, // API doesn't provide line numbers directly
          content: `Match at offset ${match.charOffset} with length ${match.length}`
        }));

        const repoName = item.repository?.name || 'Unknown';
        const filePath = item.path || '';

        return {
          repository: repoName,
          path: filePath,
          fileName: item.fileName || 'Unknown',
          content: '', // API response doesn't include the actual content
          url: `${this.orgUrl}/${projectName}/_git/${repoName}?path=${encodeURIComponent(filePath)}`,
          matches
        };
      });
    } catch (error) {
      await this.logger.logError(error);
      
      // Enhanced error handling to include HTTP status code and error details
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.message;
        throw new Error(`Code search failed with status ${statusCode}: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  /**
   * Retrieve code content from a specific file in an Azure DevOps repository
   * Using the Items API: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-7.1
   */
  async retrieveCode(request: CodeRetrievalInput): Promise<CodeRetrievalResult> {
    try {
      const projectName = request.project || this.project;

      if (!projectName) {
        throw new Error('Project name is required for code retrieval');
      }

      if (!request.repository) {
        throw new Error('Repository name is required for code retrieval');
      }

      if (!request.path) {
        throw new Error('File path is required for code retrieval');
      }

      // Ensure the path starts with a slash for the API
      const path = request.path.startsWith('/') ? request.path : `/${request.path}`;

      // Build the URL for the Git Items API
      const url = `${this.orgUrl}/${projectName}/_apis/git/repositories/${request.repository}/items`;

      // Set up query parameters
      const params = new URLSearchParams();
      params.append('api-version', '7.1');
      params.append('path', path);
      params.append('includeContent', 'true'); // Explicitly request content

      // Add the branch parameter if specified
      if (request.branch) {
        params.append('versionDescriptor.version', request.branch);
        params.append('versionDescriptor.versionType', 'branch');
      }

      // Make the API request
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json', // Request JSON instead of text
          'Authorization': `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
        }
      });

      // Get the file name from the path
      const fileName = path.split('/').pop() || 'unknown';
      
      // The response.data object should contain the file content directly in response.data.content
      // If not, it may be in the response.data directly depending on the API
      const content = typeof response.data === 'string' 
        ? response.data 
        : response.data.content || response.data;

      // Construct the result object
      const result: CodeRetrievalResult = {
        repository: request.repository,
        path: request.path,
        content: content,
        fileName,
        size: typeof content === 'string' ? content.length : JSON.stringify(content).length,
        commitId: response.headers['x-tfsgit-commitid'], // Extract the commit ID from headers if available
        url: `${this.orgUrl}/${projectName}/_git/${request.repository}?path=${encodeURIComponent(path)}`
      };

      return result;
    } catch (error) {
      await this.logger.logError(error);
      
      // Enhanced error handling to include HTTP status code and error details
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.message;
        throw new Error(`Code retrieval failed with status ${statusCode}: ${errorMessage}`);
      }
      
      throw error;
    }
  }
}
