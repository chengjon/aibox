import { InstalledComponent } from '../../types';
import { mkdirSync, existsSync, renameSync, rmSync } from 'fs';
import { join } from 'path';
import { GitHubMarketplace } from '../../integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../storage/database/sqlite-adapter';
import { tmpdir } from 'os';
import { InstallationError } from '../errors';
import { getComponentPath } from '../paths';

/**
 * Options for installing a component
 */
export interface InstallOptions {
  /** Name of the component to install */
  name: string;
  /** Marketplace identifier (format: "owner/repo" or "repo") */
  marketplace: string;
  /** Installation scope */
  scope: 'global' | 'project' | 'local';
  /** Force reinstallation if component already exists */
  force?: boolean;
}

/**
 * Package installer for components from marketplaces
 *
 * Handles downloading, validating, and installing components
 * from GitHub-based marketplaces with support for different scopes.
 */
export class PackageInstaller {
  /**
   * Create a new PackageInstaller
   * @param marketplace - Optional marketplace instance. If not provided, will be created from marketplace option
   * @param dbAdapter - Optional database adapter for recording installations
   */
  constructor(
    private marketplace?: GitHubMarketplace,
    private dbAdapter?: SQLiteAdapter
  ) {}

  /**
   * Install a component from the marketplace
   * @param options - Installation options
   * @returns The installed component with metadata
   * @throws {InstallationError} If download or validation fails
   */
  async install(options: InstallOptions): Promise<InstalledComponent> {
    // Ensure marketplace is initialized
    if (!this.marketplace) {
      this.marketplace = this.getDefaultMarketplace(options.marketplace);
    }

    // Prepare installation directory
    const installPath = this.prepareInstallDirectory(options.scope);

    // Fetch component information
    const componentInfo = await this.fetchComponentInfo(options.name);

    // Download and install component
    const component = await this.downloadAndInstall(options, installPath, componentInfo);

    // Save to database
    await this.saveComponentRecord(component);

    return component;
  }

  private prepareInstallDirectory(scope: 'global' | 'project' | 'local'): string {
    const installPath = this.getInstallPath(scope);
    mkdirSync(installPath, { recursive: true });
    return installPath;
  }

  private async fetchComponentInfo(name: string) {
    return await this.marketplace!.getComponent(name);
  }

  private async downloadAndInstall(
    options: InstallOptions,
    installPath: string,
    componentInfo: any
  ): Promise<InstalledComponent> {
    const tmpDir = join(tmpdir(), `aibox-install-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
      await this.marketplace!.downloadComponent(options.name, tmpDir);
      await this.validateComponent(tmpDir);

      const componentPath = join(installPath, options.name);
      renameSync(tmpDir, componentPath);

      return this.createComponentRecord(options, componentInfo, componentPath);
    } catch (error) {
      this.cleanupTempDirectory(tmpDir);
      throw error;
    }
  }

  private createComponentRecord(
    options: InstallOptions,
    componentInfo: any,
    componentPath: string
  ): InstalledComponent {
    return {
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
  }

  private async saveComponentRecord(component: InstalledComponent): Promise<void> {
    if (this.dbAdapter) {
      await this.dbAdapter.initialize();
      await this.dbAdapter.addComponent(component);
    }
  }

  private cleanupTempDirectory(tmpDir: string): void {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
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
    return getComponentPath('skills', scope as 'global' | 'project' | 'local');
  }

  private async validateComponent(path: string): Promise<void> {
    // Check for SKILL.md
    const skillPath = join(path, 'SKILL.md');
    if (!existsSync(skillPath)) {
      throw new InstallationError(`SKILL.md not found`, { componentPath: path });
    }
  }
}
