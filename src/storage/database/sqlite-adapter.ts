import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { Component, ComponentType, Scope } from '../../types';
import { ComponentRepository } from './component-repository';
import { getLogger } from '../../core/logger';
import { MigrationRunner, Migration } from './migrations';

const logger = getLogger();

// Database row interface for type safety
interface ComponentRow {
  id: string;
  type: ComponentType;
  name: string;
  version: string;
  description: string;
  source_type: string;
  source_location: string;
  marketplace: string | null;
  metadata_json: string | null;
  scope: Scope;
  project_path: string | null;
  installed_at: string;
  enabled: number;
  created_at: string;
}

export class SQLiteAdapter implements ComponentRepository {
  private db: Database.Database;

  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    // Ensure directory exists
    mkdirSync(dirname(this.dbPath), { recursive: true });

    this.db = new Database(this.dbPath);

    // Run migrations
    await this.runMigrations();
  }

  /**
   * Register and run database migrations
   */
  private async runMigrations(): Promise<void> {
    const runner = new MigrationRunner(this.db);

    // Register initial schema migration (version 1)
    const initialMigration: Migration = {
      version: 1,
      name: 'initial_schema',
      up: (db) => {
        // Create components table
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
        db.exec(createComponentsTable);

        // Create indexes
        const createIndexes = [
          'CREATE INDEX IF NOT EXISTS idx_components_type ON components(type)',
          'CREATE INDEX IF NOT EXISTS idx_components_scope ON components(scope)',
          'CREATE INDEX IF NOT EXISTS idx_components_enabled ON components(enabled)',
          'CREATE INDEX IF NOT EXISTS idx_components_type_scope ON components(type, scope)'
        ];

        for (const indexSql of createIndexes) {
          db.exec(indexSql);
        }

        logger.info('Initial schema created');
      }
    };

    runner.register(initialMigration);
    runner.migrateUp();
    logger.info('Migrations completed', { version: runner.getCurrentVersion() });
  }

  async addComponent(component: Component): Promise<void> {
    const addComponentTransaction = this.db.transaction(() => {
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
    });

    addComponentTransaction();
  }

  async getComponent(id: string): Promise<Component | null> {
    const row = this.db.prepare(`SELECT * FROM components WHERE id = ?`).get(id) as ComponentRow | undefined;
    if (!row) {
      return null;
    }
    return this.rowToComponent(row);
  }

  async listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]> {
    let query = 'SELECT * FROM components WHERE 1=1';
    const params: (ComponentType | Scope)[] = [];

    if (filter?.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }

    if (filter?.scope) {
      query += ' AND scope = ?';
      params.push(filter.scope);
    }

    const rows = this.db.prepare(query).all(...params) as ComponentRow[];
    return rows.map(row => this.rowToComponent(row));
  }

  async removeComponent(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM components WHERE id = ?`).run(id);
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private rowToComponent(row: ComponentRow): Component {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      version: row.version,
      description: row.description,
      source: {
        type: row.source_type,
        location: row.source_location,
        marketplace: row.marketplace || undefined
      },
      metadata: this.parseMetadata(row.metadata_json),
      scope: row.scope,
      projectPath: row.project_path || undefined,
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
      logger.warn('Failed to parse metadata JSON', { error, jsonString });
      return {};
    }
  }
}
