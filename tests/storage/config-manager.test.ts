import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/storage/config/config-manager';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('ConfigManager', () => {
  const configDir = join(process.cwd(), 'test-config');
  let manager: ConfigManager;

  beforeEach(() => {
    mkdirSync(configDir, { recursive: true });
    manager = new ConfigManager(configDir);
  });

  afterEach(() => {
    rmSync(configDir, { recursive: true, force: true });
  });

  it('should read default config when none exists', async () => {
    const config = await manager.read('global');
    expect(config).toBeDefined();
    expect(config.database.type).toBe('sqlite');
  });

  it('should read and write config values', async () => {
    await manager.set('cli.colorOutput', false, 'global');
    const value = await manager.get('cli.colorOutput', true, 'global');
    expect(value).toBe(false);
  });

  it('should return default value for missing keys', async () => {
    const value = await manager.get('nonexistent.key', 'default-value');
    expect(value).toBe('default-value');
  });

  it('should create default project config', async () => {
    const config = await manager.read('project');
    expect(config).toBeDefined();
    expect(config.project.name).toBe('');
    expect(config.settings.scope).toBe('project');
  });
});
