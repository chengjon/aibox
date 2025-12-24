import { InstalledComponent, Component } from '../../types';
import { mkdirSync, existsSync, mkdirSync as fsMkdirSync } from 'fs';
import { join } from 'path';
import { GitHubMarketplace } from '../../integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../storage/database/sqlite-adapter';
import { homedir } from 'os';
import { ValidationError, InstallationError } from '../errors';

export interface InstallOptions {
  name: string;
  marketplace: string;
  scope: 'user' | 'project' | 'local';
  force?: boolean;
  skipDeps?: boolean;
}

export class PackageInstaller {
  constructor(
    private marketplace?: GitHubMarketplace,
    private dbAdapter?: SQLiteAdapter
  ) {}

  async install(options: InstallOptions): Promise<InstalledComponent> {
    // Determine installation path
    const installPath = this.getInstallPath(options.scope);

    // Create directory if needed
    mkdirSync(installPath, { recursive: true });

    // Step 1: Fetch component info from marketplace
    if (!this.marketplace) {
      this.marketplace = this.getDefaultMarketplace(options.marketplace);
    }

    const componentInfo = await this.marketplace.getComponent(options.name);

    // Step 2: Download to temp directory
    const tmpDir = join(require('os').tmpdir(), `aibox-install-${Date.now()}`);
    fsMkdirSync(tmpDir, { recursive: true });

    try {
      await this.marketplace.downloadComponent(options.name, tmpDir);

      // Step 3: Validate component
      await this.validateComponent(tmpDir);

      // Step 4: Move to install path
      const componentPath = join(installPath, options.name);
      const { execSync } = require('child_process');
      execSync(`mv "${tmpDir}" "${componentPath}"`, { stdio: 'inherit' });

      // Step 5: Create component record
      const component: InstalledComponent = {
        id: `${options.name}-${Date.now()}`,
        name: options.name,
        type: 'skill',
        version: componentInfo.version || '1.0.0',
        description: componentInfo.description || `Installed from ${options.marketplace}`,
        source: {
          type: 'marketplace',
          location: options.marketplace,
          marketplace: options.marketplace
        },
        metadata: {},
        scope: options.scope,
        projectPath: options.scope === 'project' ? process.cwd() : undefined,
        installedAt: new Date(),
        enabled: true,
        dependencies: [],
        path: componentPath
      };

      // Step 6: Save to database
      if (this.dbAdapter) {
        await this.dbAdapter.initialize();
        await this.dbAdapter.addComponent(component);
      }

      return component;
    } catch (error) {
      // Clean up on failure
      const { rmSync } = require('fs');
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  private getDefaultMarketplace(name: string): GitHubMarketplace {
    // Parse marketplace name (format: "owner/repo" or just "repo")
    if (name.includes('/')) {
      const [owner, repo] = name.split('/');
      return new GitHubMarketplace(owner, repo);
    }
    // Default to anthropic/agent-skills
    return new GitHubMarketplace('anthropic', 'agent-skills');
  }

  private getInstallPath(scope: string): string {
    const os = require('os');
    const homedir = os.homedir();
    switch (scope) {
      case 'user':
        return join(homedir, '.aibox', 'components', 'skills');
      case 'project':
        return join(process.cwd(), '.claude', 'skills');
      case 'local':
        return join(process.cwd(), '.aibox', 'components', 'skills');
      default:
        throw new ValidationError(`Invalid scope: ${scope}`, { scope, validScopes: ['user', 'project', 'local'] });
    }
  }

  private async validateComponent(path: string): Promise<void> {
    // Check for SKILL.md
    const skillPath = join(path, 'SKILL.md');
    if (!existsSync(skillPath)) {
      throw new InstallationError(`SKILL.md not found`, { componentPath: path });
    }
  }
}
