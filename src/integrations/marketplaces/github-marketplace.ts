import axios from 'axios';
import { MarketplaceClient } from './marketplace-client';
import { MarketplaceMetadata, ComponentInfo } from '../../types';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ComponentNotFoundError, MarketplaceError } from '../../core/errors';

export class GitHubMarketplace implements MarketplaceClient {
  constructor(
    private owner: string,
    private repo: string,
    private githubToken?: string
  ) {}

  async getMetadata(): Promise<MarketplaceMetadata> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/.claude-plugin/marketplace.json`;

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      responseType: 'text'
    });

    const content = JSON.parse(response.data);
    const decoded = Buffer.from(content.content, 'base64').toString('utf-8');

    return JSON.parse(decoded);
  }

  async listComponents(): Promise<ComponentInfo[]> {
    const metadata = await this.getMetadata();
    const components: ComponentInfo[] = [];

    for (const plugin of metadata.plugins) {
      // Parse component from plugin
      if (typeof plugin.source === 'string') {
        const skillInfo: ComponentInfo = {
          name: plugin.name,
          type: 'skill',
          version: plugin.version || '1.0.0',
          description: plugin.description || '',
          keywords: []
        };
        components.push(skillInfo);
      }
    }

    return components;
  }

  async getComponent(name: string): Promise<ComponentInfo> {
    const components = await this.listComponents();
    const component = components.find(c => c.name === name);

    if (!component) {
      throw new ComponentNotFoundError(name, `${this.owner}/${this.repo}`);
    }

    return component;
  }

  async downloadComponent(name: string, targetPath: string): Promise<void> {
    // Download component from GitHub repository
    const tmpDir = join(tmpdir(), `aibox-download-${Date.now()}`);

    try {
      // Clone the repository to temporary directory
      const cloneUrl = `https://github.com/${this.owner}/${this.repo}.git`;
      execSync(`git clone --depth 1 ${cloneUrl} ${tmpDir}`, { stdio: 'inherit' });

      // Find the component directory
      const componentSourcePath = join(tmpDir, 'skills', name);
      const componentAltPath = join(tmpDir, name);

      if (existsSync(componentSourcePath)) {
        // Copy component to target path
        execSync(`cp -r "${componentSourcePath}" "${targetPath}"`, { stdio: 'inherit' });
      } else if (existsSync(componentAltPath)) {
        execSync(`cp -r "${componentAltPath}" "${targetPath}"`, { stdio: 'inherit' });
      } else {
        throw new MarketplaceError(`Component "${name}" not found in repository`, {
          component: name,
          repo: `${this.owner}/${this.repo}`,
          searchPaths: [componentSourcePath, componentAltPath]
        });
      }
    } finally {
      // Clean up temporary directory
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  }

  async search(query: string): Promise<ComponentInfo[]> {
    const components = await this.listComponents();
    const lowerQuery = query.toLowerCase();

    return components.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
    );
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    return headers;
  }
}
