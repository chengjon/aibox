import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { Component, ComponentType, Scope } from '../../types';

export class SQLiteAdapter {
  private db: Database.Database;

  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    // Ensure directory exists
    mkdirSync(dirname(this.dbPath), { recursive: true });

    this.db = new Database(this.dbPath);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    const createSkillsTable = `
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPluginsTable = `
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createCommandsTable = `
      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createAgentsTable = `
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createMcpServersTable = `
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.exec(createSkillsTable);
    this.db.exec(createPluginsTable);
    this.db.exec(createCommandsTable);
    this.db.exec(createAgentsTable);
    this.db.exec(createMcpServersTable);
  }

  async addComponent(component: Component): Promise<void> {
    const tableName = this.getTableName(component.type);
    const stmt = this.db.prepare(`
      INSERT INTO ${tableName} (
        id, name, version, description, source_type, source_location,
        marketplace, metadata_json, scope, project_path, installed_at, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      component.id,
      component.name,
      component.version,
      component.description,
      component.source.type,
      component.source.location,
      component.source.marketplace || null,
      JSON.stringify(component.metadata),
      component.scope,
      component.projectPath || null,
      component.installedAt.toISOString(),
      component.enabled ? 1 : 0
    );
  }

  async getComponent(id: string): Promise<Component | null> {
    // Search in all tables
    const tables = ['skills', 'plugins', 'commands', 'agents', 'mcp_servers'];

    for (const table of tables) {
      const row = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as any;
      if (row) {
        return this.rowToComponent(row, this.getTypeFromTable(table));
      }
    }

    return null;
  }

  async listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]> {
    let query = 'SELECT * FROM ';
    let params: any[] = [];

    if (filter?.type) {
      query = `SELECT * FROM ${this.getTableName(filter.type)}`;
    } else {
      // Union all tables (simplified for skills first)
      query = 'SELECT * FROM skills';
    }

    if (filter?.scope) {
      query += ' WHERE scope = ?';
      params.push(filter.scope);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(row => this.rowToComponent(row, filter?.type || 'skill'));
  }

  async removeComponent(id: string): Promise<void> {
    // Try to delete from all tables
    const tables = ['skills', 'plugins', 'commands', 'agents', 'mcp_servers'];
    for (const table of tables) {
      this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private getTableName(type: ComponentType): string {
    const tableMap: Record<ComponentType, string> = {
      skill: 'skills',
      plugin: 'plugins',
      command: 'commands',
      agent: 'agents',
      mcp_server: 'mcp_servers'
    };
    return tableMap[type] || 'skills';
  }

  private getTypeFromTable(table: string): ComponentType {
    const typeMap: Record<string, ComponentType> = {
      skills: 'skill',
      plugins: 'plugin',
      commands: 'command',
      agents: 'agent',
      mcp_servers: 'mcp_server'
    };
    return typeMap[table] || 'skill';
  }

  private rowToComponent(row: any, type: ComponentType): Component {
    return {
      id: row.id,
      name: row.name,
      type: type,
      version: row.version,
      description: row.description,
      source: {
        type: row.source_type,
        location: row.source_location,
        marketplace: row.marketplace
      },
      metadata: JSON.parse(row.metadata_json || '{}'),
      scope: row.scope,
      projectPath: row.project_path,
      installedAt: new Date(row.installed_at),
      enabled: row.enabled === 1,
      dependencies: []
    };
  }
}
