import { describe, it, expect } from 'vitest';
import { createInstallCommand } from '../../../src/interfaces/cli/commands/install';
import { ConfigManager } from '../../../src/storage/config/config-manager';
import { PackageInstaller } from '../../../src/core/installer/package-installer';

describe('install command', () => {
  it('should create install command', () => {
    const configManager = new ConfigManager('~/.aibox');
    const installer = new PackageInstaller();
    const cmd = createInstallCommand(configManager, installer);
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('install');
  });
});
