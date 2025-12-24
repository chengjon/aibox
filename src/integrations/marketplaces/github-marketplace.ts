import axios from 'axios';
import { MarketplaceMetadata, ComponentInfo } from '../../types';
import { execa } from 'execa';
import { existsSync, rmSync, cpSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ComponentNotFoundError, InstallationError, ValidationError } from '../../core/errors';

// Validate GitHub repository name format (alphanumeric, hyphens, underscores)
const REPO_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export class GitHubMarketplace {
  private componentsCache: ComponentInfo[] | null = null;

  constructor(
    private owner: string,
    private repo: string,
    private githubToken?: string
  ) {
    // Validate repository format to prevent command injection
    if (!REPO_NAME_REGEX.test(owner)) {
      throw new ValidationError(`Invalid owner name: ${owner}`, {
        owner,
        pattern: REPO_NAME_REGEX.toString()
      });
    }
    if (!REPO_NAME_REGEX.test(repo)) {
      throw new ValidationError(`Invalid repository name: ${repo}`, {
        repo,
        pattern: REPO_NAME_REGEX.toString()
      });
    }
  }

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
    // Return cached components if available
    if (this.componentsCache) {
      return this.componentsCache;
    }

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

    // Cache the components
    this.componentsCache = components;
    return components;
  }

  async getComponent(name: string): Promise<ComponentInfo> {
    // Use cached list to avoid fetching all components
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
      // Clone the repository to temporary directory using execa for safer command execution
      const cloneUrl = `https://github.com/${this.owner}/${this.repo}.git`;
      await execa('git', ['clone', '--depth', '1', cloneUrl, tmpDir]);

      // Find the component directory
      const componentSourcePath = join(tmpDir, 'skills', name);
      const componentAltPath = join(tmpDir, name);

      if (existsSync(componentSourcePath)) {
        // Copy component to target path using Node.js API
        cpSync(componentSourcePath, targetPath, { recursive: true });
      } else if (existsSync(componentAltPath)) {
        cpSync(componentAltPath, targetPath, { recursive: true });
      } else {
        throw new InstallationError(`Component "${name}" not found in repository`, {
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
