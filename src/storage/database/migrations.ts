/**
 * Database schema migration system
 *
 * Provides version tracking and migration execution for database schema changes.
 */

import Database from 'better-sqlite3';
import { getLogger } from '../../core/logger';

const logger = getLogger();

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

export interface MigrationRecord {
  version: number;
  name: string;
  appliedAt: string;
}

interface MigrationRow {
  version: number;
  name: string;
  applied_at: string;
}

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * Migration runner for managing database schema changes
 */
export class MigrationRunner {
  private migrations: Map<number, Migration> = new Map();

  constructor(private db: Database.Database) {
    this.ensureMigrationsTable();
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} is already registered`);
    }
    this.migrations.set(migration.version, migration);
  }

  /**
   * Get the current schema version
   */
  getCurrentVersion(): number {
    const row = this.db
      .prepare('SELECT MAX(version) as version FROM _schema_migrations')
      .get() as { version: number | null };
    return row?.version || 0;
  }

  /**
   * Get all applied migrations
   */
  getAppliedMigrations(): MigrationRecord[] {
    const rows = this.db
      .prepare('SELECT version, name, applied_at FROM _schema_migrations ORDER BY version')
      .all() as MigrationRow[];
    return rows.map(row => ({
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
    }));
  }

  /**
   * Run pending migrations up to a target version
   */
  migrateUp(toVersion?: number): number {
    const currentVersion = this.getCurrentVersion();
    const targetVersion = toVersion ?? Math.max(...this.migrations.keys());

    if (currentVersion >= targetVersion) {
      logger.info('No migrations to run', { currentVersion, targetVersion });
      return currentVersion;
    }

    logger.info('Running migrations', { from: currentVersion, to: targetVersion });

    const migrate = this.db.transaction(() => {
      let version = currentVersion;
      while (version < targetVersion) {
        const nextVersion = this.getNextVersion(version);
        if (!nextVersion) {
          logger.warn('No more migrations available', { currentVersion: version, targetVersion });
          break;
        }

        const migration = this.migrations.get(nextVersion);
        if (!migration) {
          throw new Error(`Migration version ${nextVersion} not found`);
        }

        logger.info(`Running migration ${nextVersion}: ${migration.name}`);
        migration.up(this.db);

        this.recordMigration(migration);
        version = nextVersion;
      }
      return version;
    });

    return migrate();
  }

  /**
   * Rollback migrations to a target version
   */
  migrateDown(toVersion: number): number {
    const currentVersion = this.getCurrentVersion();

    if (currentVersion <= toVersion) {
      logger.info('No migrations to rollback', { currentVersion, toVersion });
      return currentVersion;
    }

    logger.info('Rolling back migrations', { from: currentVersion, to: toVersion });

    const migrate = this.db.transaction(() => {
      let version = currentVersion;
      while (version > toVersion) {
        const migration = this.migrations.get(version);
        if (!migration) {
          throw new Error(`Migration version ${version} not found`);
        }

        if (!migration.down) {
          throw new Error(`Migration version ${version} does not support rollback`);
        }

        logger.info(`Rolling back migration ${version}: ${migration.name}`);
        migration.down(this.db);

        this.removeMigrationRecord(version);
        version = this.getPreviousVersion(version);
      }
      return version;
    });

    return migrate();
  }

  /**
   * Ensure the migrations table exists
   */
  private ensureMigrationsTable(): void {
    this.db.exec(MIGRATIONS_TABLE);
  }

  /**
   * Record a migration as applied
   */
  private recordMigration(migration: Migration): void {
    this.db
      .prepare('INSERT INTO _schema_migrations (version, name) VALUES (?, ?)')
      .run(migration.version, migration.name);
  }

  /**
   * Remove a migration record
   */
  private removeMigrationRecord(version: number): void {
    this.db.prepare('DELETE FROM _schema_migrations WHERE version = ?').run(version);
  }

  /**
   * Get the next migration version
   */
  private getNextVersion(currentVersion: number): number | null {
    const versions = Array.from(this.migrations.keys()).filter(v => v > currentVersion);
    return versions.length > 0 ? Math.min(...versions) : null;
  }

  /**
   * Get the previous migration version
   */
  private getPreviousVersion(currentVersion: number): number | null {
    const versions = Array.from(this.migrations.keys()).filter(v => v < currentVersion);
    return versions.length > 0 ? Math.max(...versions) : null;
  }
}
