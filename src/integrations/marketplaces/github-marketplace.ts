import axios from 'axios';
import { MarketplaceClient } from './marketplace-client';
import { MarketplaceMetadata, ComponentInfo } from '../../types';

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
      throw new Error(`Component ${name} not found`);
    }

    return component;
  }

  async downloadComponent(name: string, targetPath: string): Promise<void> {
    // Implementation for downloading component
    // This will clone the repo or download specific directory
    throw new Error('Not implemented yet');
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
