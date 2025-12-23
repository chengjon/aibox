import { InstalledComponent } from '../../types';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface InstallOptions {
  name: string;
  marketplace: string;
  scope: 'user' | 'project' | 'local';
  force?: boolean;
  skipDeps?: boolean;
}

export class PackageInstaller {
  async install(options: InstallOptions): Promise<InstalledComponent> {
    // Determine installation path
    const installPath = this.getInstallPath(options.scope);

    // Create directory if needed
    mkdirSync(installPath, { recursive: true });

    // Download component (placeholder for now)
    const componentPath = join(installPath, options.name);

    // Validate component
    await this.validateComponent(componentPath);

    // Create component record
    const component: InstalledComponent = {
      id: `${options.name}-${Date.now()}`,
      name: options.name,
      type: 'skill', // Auto-detect later
      version: '1.0.0',
      description: `Installed from ${options.marketplace}`,
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

    return component;
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
        throw new Error(`Invalid scope: ${scope}`);
    }
  }

  private async validateComponent(path: string): Promise<void> {
    // Check for SKILL.md
    const skillPath = join(path, 'SKILL.md');
    if (!existsSync(skillPath)) {
      throw new Error(`SKILL.md not found in ${path}`);
    }
  }
}
