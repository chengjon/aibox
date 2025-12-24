import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { Component } from '../../src/types';
import { rmSync } from 'fs';
import { join } from 'path';

describe('SQLiteAdapter', () => {
  const dbPath = join(process.cwd(), 'test.db');
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(dbPath);
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.close();
    rmSync(dbPath);
  });

  it('should insert and retrieve a component', async () => {
    const component: Component = {
      id: 'test-1',
      name: 'test-skill',
      type: 'skill',
      version: '1.0.0',
      description: 'Test skill',
      source: { type: 'marketplace', location: 'test' },
      metadata: {},
      scope: 'global',
      installedAt: new Date(),
      enabled: true,
      dependencies: []
    };

    await adapter.addComponent(component);
    const retrieved = await adapter.getComponent('test-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test-skill');
  });
});
