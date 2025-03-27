import * as azdev from 'azure-devops-node-api';
import axios from 'axios';
import { WikiSearchRequest, WikiSearchResult, CodeSearchRequest, CodeSearchResult } from '../types';

export class AzureDevOpsService {
  private orgUrl: string;
  private token: string;
  private project: string;
  private connection: azdev.WebApi;

  constructor() {
    this.orgUrl = process.env.AZURE_DEVOPS_ORG_URL || '';
    this.token = process.env.AZURE_DEVOPS_PAT || '';
    this.project = process.env.AZURE_DEVOPS_PROJECT || '';

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
  async searchWiki(request: WikiSearchRequest): Promise<WikiSearchResult[]> {
    try {
      const projectName = request.project || this.project;
      const maxResults = request.maxResults || 10;
      
      if (!projectName) {
        throw new Error('Project name is required for wiki search');
      }

      // Using Azure DevOps REST API for wiki search
      const url = `${this.orgUrl}/${projectName}/_apis/search/wikisearchresults?api-version=7.0`;
      const response = await axios.post(
        url,
        {
          searchText: request.query,
          $top: maxResults,
          filters: {
            projectName: [projectName]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
          }
        }
      );

      // Transform the response into WikiSearchResult[]
      const results: WikiSearchResult[] = [];
      
      if (response.data && response.data.results) {
        for (const item of response.data.results) {
          results.push({
            id: item.id || `wiki-${results.length}`,
            title: item.fileName || 'Unknown',
            content: item.content || item.highlights || '',
            path: item.path || '',
            url: `${this.orgUrl}/${projectName}/_wiki/wikis/${item.collection?.name || 'ProjectWiki'}/${item.path || ''}`
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching wiki:', error);
      throw error;
    }
  }

  /**
   * Search for code in Azure DevOps repositories
   */
  async searchCode(request: CodeSearchRequest): Promise<CodeSearchResult[]> {
    try {
      const projectName = request.project || this.project;
      const maxResults = request.maxResults || 10;
      
      if (!projectName) {
        throw new Error('Project name is required for code search');
      }

      // Using Azure DevOps REST API for code search
      const url = `${this.orgUrl}/${projectName}/_apis/search/codesearchresults?api-version=7.0`;
      
      // Build the request body
      const requestBody: any = {
        searchText: request.query,
        $top: maxResults,
        filters: {
          project: [projectName]
        }
      };

      // Add repository filter if specified
      if (request.repository) {
        requestBody.filters.repository = [request.repository];
      }

      // Add file extension filter if specified
      if (request.fileExtensions && request.fileExtensions.length > 0) {
        requestBody.filters.extension = request.fileExtensions;
      }

      const response = await axios.post(
        url,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
          }
        }
      );

      // Transform the response into CodeSearchResult[]
      const results: CodeSearchResult[] = [];
      
      if (response.data && response.data.results) {
        for (const item of response.data.results) {
          const matches = item.matches?.map((match: any) => ({
            line: match.lineNumber || 0,
            content: match.content || ''
          })) || [];

          results.push({
            repository: item.repository?.name || 'Unknown',
            path: item.path || '',
            fileName: item.fileName || 'Unknown',
            content: item.content || '',
            url: `${this.orgUrl}/${projectName}/_git/${item.repository?.name || ''}?path=${encodeURIComponent(item.path || '')}`,
            matches
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching code:', error);
      throw error;
    }
  }
}
