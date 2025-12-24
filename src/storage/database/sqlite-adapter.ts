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
    const createComponentsTable = `
      CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, name)
      )
    `;

    this.db.exec(createComponentsTable);
  }

  async addComponent(component: Component): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO components (
        id, type, name, version, description, source_type, source_location,
        marketplace, metadata_json, scope, project_path, installed_at, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      component.id,
      component.type,
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
    const row = this.db.prepare(`SELECT * FROM components WHERE id = ?`).get(id) as any;
    if (!row) {
      return null;
    }
    return this.rowToComponent(row);
  }

  async listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]> {
    let query = 'SELECT * FROM components WHERE 1=1';
    let params: any[] = [];

    if (filter?.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }

    if (filter?.scope) {
      query += ' AND scope = ?';
      params.push(filter.scope);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(row => this.rowToComponent(row));
  }

  async removeComponent(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM components WHERE id = ?`).run(id);
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private rowToComponent(row: any): Component {
    return {
      id: row.id,
      name: row.name,
      type: row.type as ComponentType,
      version: row.version,
      description: row.description,
      source: {
        type: row.source_type,
        location: row.source_location,
        marketplace: row.marketplace
      },
      metadata: this.parseMetadata(row.metadata_json),
      scope: row.scope,
      projectPath: row.project_path,
      installedAt: new Date(row.installed_at),
      enabled: row.enabled === 1,
      dependencies: []
    };
  }

  private parseMetadata(jsonString: string | null): Record<string, unknown> {
    if (!jsonString || jsonString.trim() === '') {
      return {};
    }
    try {
      return JSON.parse(jsonString) as Record<string, unknown>;
    } catch (error) {
      console.warn(`Failed to parse metadata JSON: ${error}`);
      return {};
    }
  }
}
