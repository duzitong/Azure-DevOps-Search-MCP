import fs from 'fs';
import path from 'path';
import os from 'os';
import { WikiSearchInput, CodeSearchInput } from '../../types/index.js';

export class SearchLogger {
    private logDir: string;
    private logFile: string;

    constructor() {
        // Use LOG_DIR from environment if provided, otherwise use OS temp directory
        this.logDir = process.env.LOG_DIR || path.join(os.tmpdir(), 'azure-devops-search-mcp', 'logs');
        this.logFile = path.join(this.logDir, 'search-requests.log');
        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatLogEntry(type: 'wiki' | 'code', request: WikiSearchInput | CodeSearchInput): string {
        const timestamp = new Date().toISOString();
        return JSON.stringify({
            timestamp,
            type,
            request,
        }) + '\n';
    }

    public async logWikiSearch(request: WikiSearchInput): Promise<void> {
        const logEntry = this.formatLogEntry('wiki', request);
        await fs.promises.appendFile(this.logFile, logEntry, 'utf8');
    }

    public async logCodeSearch(request: CodeSearchInput): Promise<void> {
        const logEntry = this.formatLogEntry('code', request);
        await fs.promises.appendFile(this.logFile, logEntry, 'utf8');
    }

    public async logError(error: any): Promise<void> {
        const timestamp = new Date().toISOString();
        const errorMessage = error.response?.data || error.message || String(error);
        const logEntry = JSON.stringify({
            timestamp,
            type: 'error',
            error: errorMessage,
            stack: error.stack
        }) + '\n';
        await fs.promises.appendFile(this.logFile, logEntry, 'utf8');
    }
}